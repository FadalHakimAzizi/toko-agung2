// Mengisi kolom embedding pada knowledge_base memakai Google Gemini.
// Jalankan setelah migrate & seed: npm run db:embed
// Aman diulang: hanya baris yang embedding-nya masih NULL yang diproses.
import pg from "pg"

try {
  process.loadEnvFile(".env")
} catch {
  // .env belum ada; variabel mungkin sudah diatur lewat environment
}

const connectionString = process.env.DATABASE_URL
const apiKey = process.env.EMBEDDING_API_KEY

if (!connectionString) {
  console.error("❌ DATABASE_URL belum diatur.")
  process.exit(1)
}
if (!apiKey) {
  console.error("❌ EMBEDDING_API_KEY belum diatur di .env. Isi dulu API key Google Gemini.")
  process.exit(1)
}

const EMBEDDING_DIM = 768
const model = process.env.EMBEDDING_MODEL || "gemini-embedding-001"
const baseUrl = (process.env.EMBEDDING_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "")
const needSsl = process.env.DATABASE_SSL === "true" || connectionString.includes("supabase.co") || connectionString.includes("supabase.com")
const client = new pg.Client({ connectionString, ssl: needSsl ? { rejectUnauthorized: false } : undefined })

// Mendukung Gemini (native embedContent) atau OpenAI-compatible /embeddings (Jina, dll.)
async function embed(text) {
  const clipped = text.slice(0, 8000)
  if (baseUrl.includes("generativelanguage.googleapis.com")) {
    const res = await fetch(`${baseUrl}/models/${model}:embedContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text: clipped }] }, outputDimensionality: EMBEDDING_DIM }),
    })
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const values = data?.embedding?.values
    if (!Array.isArray(values)) throw new Error("Respons embedding tidak valid")
    return values
  }
  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input: clipped, dimensions: EMBEDDING_DIM }),
  })
  if (!res.ok) throw new Error(`Embedding ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const values = data?.data?.[0]?.embedding
  if (!Array.isArray(values)) throw new Error("Respons embedding tidak valid")
  return values
}

async function main() {
  await client.connect()
  const { rows } = await client.query(
    "SELECT id, judul, konten FROM knowledge_base WHERE embedding IS NULL ORDER BY id",
  )

  if (rows.length === 0) {
    console.log("✅ Semua entri knowledge base sudah memiliki embedding.")
    return
  }

  console.log(`▶ Membuat embedding untuk ${rows.length} entri knowledge base...`)
  let ok = 0
  for (const row of rows) {
    // Gabungkan judul + konten agar konteks embedding lebih kaya
    const teks = `${row.judul}. ${row.konten}`
    try {
      const vec = await embed(teks)
      await client.query("UPDATE knowledge_base SET embedding = $1::vector WHERE id = $2", [
        `[${vec.join(",")}]`,
        row.id,
      ])
      ok++
      console.log(`  ✓ [${ok}/${rows.length}] ${row.judul}`)
    } catch (err) {
      console.error(`  ✗ Gagal: ${row.judul} — ${err.message}`)
    }
  }
  console.log(`✅ Selesai. ${ok} dari ${rows.length} entri berhasil di-embed.`)
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message)
    process.exitCode = 1
  })
  .finally(() => client.end())
