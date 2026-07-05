// Chatbot RAG (Retrieval-Augmented Generation) Toko Alat Tulis Agung.
//
// Tahapan:
// 1. RETRIEVAL — mencari konteks relevan dari database aplikasi
//    (barang/stok/harga, pengaturan toko, ringkasan laporan untuk admin)
//    dan knowledge base (FAQ, profil, kebijakan) memakai keyword search.
// 2. GENERATION — jika AI_API_KEY diatur, jawaban disusun LLM (endpoint yang
//    kompatibel OpenAI Chat Completions) HANYA berdasarkan konteks temuan.
//    Jika tidak, dipakai jawaban template dari konteks yang sama (fallback aman).
//
// Chatbot hanya menjawab seputar toko; pertanyaan di luar konteks ditolak
// dengan kalimat baku dan tidak boleh mengarang jawaban.
import { query } from "@/lib/db"
import { embedText, toVectorLiteral } from "@/lib/embedding"

export const REFUSAL_MESSAGE = "Maaf, saya hanya dapat membantu informasi seputar Toko Alat Tulis Agung."

// Ambang jarak cosine (pgvector <=>). Entri knowledge base dengan jarak lebih
// besar dianggap tidak relevan dan dibuang. 0 = identik, semakin kecil semakin mirip.
const KB_DISTANCE_THRESHOLD = 0.6

// Kata umum bahasa Indonesia yang tidak dipakai sebagai kata kunci pencarian
const STOPWORDS = new Set([
  "yang", "untuk", "dengan", "atau", "dan", "apa", "apakah", "berapa", "bagaimana",
  "dimana", "di", "ke", "dari", "ada", "itu", "ini", "saya", "kamu", "anda", "kah",
  "bisa", "boleh", "mau", "ingin", "tolong", "mohon", "ya", "tidak", "kak", "min",
  "dong", "sih", "nya", "harga", "stok", "stock", "barang", "produk", "jual", "beli",
  "tersedia", "punya", "masih", "berapaan", "info", "tentang", "toko",
])

// Sanitasi input: batasi panjang, buang karakter kontrol
export function sanitizeQuestion(raw: unknown): string {
  return String(raw ?? "")
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500)
}

function extractKeywords(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

export interface RetrievedContext {
  produk: { nama_barang: string; harga: number; stok: number; satuan: string; kategori: string }[]
  pengetahuan: { judul: string; konten: string }[]
  infoToko: Record<string, string>
  laporanAdmin: string | null
  sumber: string[]
}

// ---------- Tahap RETRIEVAL ----------
export async function retrieveContext(question: string, isAdmin: boolean): Promise<RetrievedContext> {
  const q = question.toLowerCase()
  const keywords = extractKeywords(question)
  const sumber: string[] = []

  // 1) Produk dari database: dicari jika ada kata kunci, atau pertanyaan
  //    menyebut harga/stok/produk secara umum
  let produk: RetrievedContext["produk"] = []
  const tanyaProduk = /harga|stok|stock|produk|barang|jual|tersedia|katalog|beli/.test(q)
  if (keywords.length > 0) {
    const likeParams = keywords.map((k) => `%${k}%`)
    const conditions = likeParams.map((_, i) => `b.nama_barang ILIKE $${i + 1}`).join(" OR ")
    produk = await query(
      `SELECT b.nama_barang, b.harga::float8 AS harga, b.stok, b.satuan,
              COALESCE(k.nama_kategori, 'Tanpa Kategori') AS kategori
       FROM barang b
       LEFT JOIN kategori k ON k.id = b.kategori_id
       WHERE b.status = 'aktif' AND (${conditions})
       ORDER BY b.nama_barang LIMIT 8`,
      likeParams,
    )
  }
  if (produk.length === 0 && tanyaProduk && /apa saja|daftar|list|semua|katalog/.test(q)) {
    // Pertanyaan daftar produk secara umum
    produk = await query(
      `SELECT b.nama_barang, b.harga::float8 AS harga, b.stok, b.satuan,
              COALESCE(k.nama_kategori, 'Tanpa Kategori') AS kategori
       FROM barang b LEFT JOIN kategori k ON k.id = b.kategori_id
       WHERE b.status = 'aktif' ORDER BY b.nama_barang LIMIT 15`,
    )
  }
  if (produk.length > 0) sumber.push("database produk")

  // 2) Knowledge base — RAG retrieval.
  //    Utamakan SEMANTIC SEARCH via embedding + pgvector (paham makna/parafrase);
  //    bila embedding tidak tersedia atau tak ada hasil relevan, fallback ke
  //    keyword search (ILIKE). Kedua jalur tetap "retrieval augmented".
  let pengetahuan: RetrievedContext["pengetahuan"] = []

  const questionVector = await embedText(question)
  if (questionVector) {
    const rows = await query<{ judul: string; konten: string; distance: number }>(
      `SELECT judul, konten, (embedding <=> $1::vector) AS distance
       FROM knowledge_base
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 4`,
      [toVectorLiteral(questionVector)],
    )
    // Buang entri yang jaraknya melebihi ambang (tidak relevan)
    pengetahuan = rows.filter((r) => Number(r.distance) <= KB_DISTANCE_THRESHOLD).map((r) => ({ judul: r.judul, konten: r.konten }))
    if (pengetahuan.length > 0) sumber.push("knowledge base (semantic)")
  }

  // Fallback keyword bila semantic search tidak menghasilkan apa pun
  if (pengetahuan.length === 0 && keywords.length > 0) {
    const likeParams = keywords.map((k) => `%${k}%`)
    const conditions = likeParams
      .map((_, i) => `(kata_kunci ILIKE $${i + 1} OR judul ILIKE $${i + 1} OR konten ILIKE $${i + 1})`)
      .join(" OR ")
    pengetahuan = await query(
      `SELECT judul, konten FROM knowledge_base WHERE ${conditions} LIMIT 4`,
      likeParams,
    )
    if (pengetahuan.length > 0) sumber.push("knowledge base")
  }

  // 3) Info toko dari settings (selalu disertakan — ringan dan sering relevan)
  const settingRows = await query("SELECT key, value FROM settings WHERE key != 'qris_image'")
  const infoToko: Record<string, string> = {}
  for (const row of settingRows) infoToko[row.key] = row.value

  // 4) Ringkasan laporan sederhana — hanya untuk admin
  let laporanAdmin: string | null = null
  if (isAdmin && /laporan|omset|penjualan|pendapatan|transaksi|verifikasi/.test(q)) {
    const [r] = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM transactions WHERE status = 'lunas' AND tanggal::date = CURRENT_DATE) AS trx_hari_ini,
        (SELECT COALESCE(SUM(total_harga), 0)::float8 FROM transactions WHERE status = 'lunas' AND tanggal::date = CURRENT_DATE) AS omset_hari_ini,
        (SELECT COALESCE(SUM(total_harga), 0)::float8 FROM transactions WHERE status = 'lunas' AND date_trunc('month', tanggal) = date_trunc('month', NOW())) AS omset_bulan_ini,
        (SELECT COUNT(*)::int FROM payments WHERE status = 'menunggu_verifikasi') AS menunggu_verifikasi,
        (SELECT COUNT(*)::int FROM barang WHERE stok <= stok_minimum) AS stok_menipis
    `)
    laporanAdmin =
      `Transaksi lunas hari ini: ${r.trx_hari_ini}. ` +
      `Omset hari ini: Rp ${Number(r.omset_hari_ini).toLocaleString("id-ID")}. ` +
      `Omset bulan ini: Rp ${Number(r.omset_bulan_ini).toLocaleString("id-ID")}. ` +
      `Pembayaran menunggu verifikasi: ${r.menunggu_verifikasi}. ` +
      `Barang stok menipis: ${r.stok_menipis}.`
    sumber.push("laporan admin")
  }

  return { produk, pengetahuan, infoToko, laporanAdmin, sumber }
}

// Menyusun teks konteks yang dikirim ke LLM / dipakai jawaban template
export function buildContextText(ctx: RetrievedContext): string {
  const bagian: string[] = []

  if (ctx.produk.length > 0) {
    bagian.push(
      "DATA PRODUK (dari database):\n" +
        ctx.produk
          .map(
            (p) =>
              `- ${p.nama_barang} (${p.kategori}): harga Rp ${p.harga.toLocaleString("id-ID")}/${p.satuan}, stok ${p.stok}`,
          )
          .join("\n"),
    )
  }
  if (ctx.pengetahuan.length > 0) {
    bagian.push(
      "PENGETAHUAN TOKO (knowledge base):\n" +
        ctx.pengetahuan.map((k) => `- ${k.judul}: ${k.konten}`).join("\n"),
    )
  }
  const info = ctx.infoToko
  if (Object.keys(info).length > 0) {
    bagian.push(
      "INFO TOKO:\n" +
        [
          info.store_name && `- Nama: ${info.store_name}`,
          info.store_address && `- Alamat: ${info.store_address}`,
          info.store_phone && `- Telepon: ${info.store_phone}`,
          info.store_email && `- Email: ${info.store_email}`,
          info.store_hours && `- Jam operasional: ${info.store_hours}`,
        ]
          .filter(Boolean)
          .join("\n"),
    )
  }
  if (ctx.laporanAdmin) {
    bagian.push(`RINGKASAN LAPORAN (khusus admin):\n${ctx.laporanAdmin}`)
  }

  return bagian.join("\n\n")
}

// Deteksi pertanyaan seputar info toko yang selalu bisa dijawab dari settings
function tanyaInfoToko(q: string): boolean {
  return /alamat|lokasi|dimana|di mana|jam|buka|tutup|telepon|telpon|kontak|hubungi|email|profil|toko apa/.test(q)
}

// ---------- Tahap GENERATION: fallback template (tanpa LLM) ----------
export function buildTemplateAnswer(question: string, ctx: RetrievedContext): string {
  const q = question.toLowerCase()
  const jawaban: string[] = []

  if (ctx.produk.length > 0) {
    jawaban.push(
      "Berikut informasi produk yang saya temukan:\n" +
        ctx.produk
          .map((p) => {
            const stokInfo = p.stok > 0 ? `stok tersedia ${p.stok} ${p.satuan}` : "stok sedang habis"
            return `• ${p.nama_barang} — Rp ${p.harga.toLocaleString("id-ID")}/${p.satuan} (${stokInfo})`
          })
          .join("\n"),
    )
  }
  if (ctx.pengetahuan.length > 0) {
    jawaban.push(ctx.pengetahuan.map((k) => k.konten).join("\n\n"))
  }
  if (ctx.laporanAdmin) {
    jawaban.push(`Ringkasan laporan: ${ctx.laporanAdmin}`)
  }
  if (jawaban.length === 0 && tanyaInfoToko(q)) {
    const info = ctx.infoToko
    const potongan = [
      /alamat|lokasi|dimana|di mana/.test(q) && info.store_address && `Alamat: ${info.store_address}`,
      /jam|buka|tutup/.test(q) && info.store_hours && `Jam operasional: ${info.store_hours}`,
      /telepon|telpon|kontak|hubungi/.test(q) && info.store_phone && `Telepon: ${info.store_phone}`,
      /email/.test(q) && info.store_email && `Email: ${info.store_email}`,
    ].filter(Boolean) as string[]
    if (potongan.length > 0) {
      jawaban.push(potongan.join("\n"))
    } else if (info.store_name) {
      jawaban.push(
        `${info.store_name}\nAlamat: ${info.store_address ?? "-"}\nJam operasional: ${info.store_hours ?? "-"}\nTelepon: ${info.store_phone ?? "-"}`,
      )
    }
  }

  // Tidak ada konteks yang cocok → tolak, jangan mengarang jawaban
  if (jawaban.length === 0) return REFUSAL_MESSAGE
  return jawaban.join("\n\n")
}

// ---------- Tahap GENERATION: LLM (jika AI_API_KEY tersedia) ----------
export async function generateLlmAnswer(question: string, contextText: string): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return null

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  const model = process.env.AI_MODEL || "gpt-4o-mini"

  const systemPrompt =
    "Kamu adalah asisten virtual Toko Alat Tulis Agung. " +
    "Jawab dalam bahasa Indonesia yang ramah dan ringkas, HANYA berdasarkan KONTEKS yang diberikan. " +
    "KONTEKS dapat memuat beberapa potongan informasi; gunakan bagian yang relevan dengan pertanyaan untuk menjawab, dan abaikan bagian yang tidak relevan. " +
    "Tolak HANYA jika tidak ada satu pun bagian konteks yang relevan, atau pertanyaan di luar topik toko " +
    "(stok, harga, produk, FAQ, profil, alamat, jam operasional, kebijakan pembayaran, laporan). " +
    `Saat menolak, jawab persis: "${REFUSAL_MESSAGE}" ` +
    "Jangan pernah mengarang data harga/stok yang tidak ada di konteks."

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `KONTEKS:\n${contextText || "(tidak ada konteks ditemukan)"}\n\nPERTANYAAN: ${question}` },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      console.error("LLM error:", response.status, await response.text())
      return null // gagal → pemanggil memakai jawaban template
    }
    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content
    return typeof answer === "string" && answer.trim() ? answer.trim() : null
  } catch (err) {
    console.error("LLM request gagal:", err)
    return null
  }
}
