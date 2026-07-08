import { describe, it, expect, vi, beforeEach } from "vitest"
import type { RetrievedContext } from "@/lib/rag"

const queryMock = vi.fn()
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }))
// Default: embedding tidak "dikonfigurasi" (null) — memaksa retrieveContext
// lewat jalur keyword search. Test semantic search meng-override ini secara
// eksplisit per-test lewat embedTextMock.mockResolvedValueOnce(...).
const embedTextMock = vi.fn().mockResolvedValue(null)
vi.mock("@/lib/embedding", () => ({
  embedText: (...args: unknown[]) => embedTextMock(...args),
  toVectorLiteral: (v: number[]) => `[${v.join(",")}]`,
}))

const {
  sanitizeQuestion,
  isGreetingOnly,
  buildContextText,
  buildTemplateAnswer,
  retrieveContext,
  REFUSAL_MESSAGE,
  GREETING_MESSAGE,
} = await import("@/lib/rag")

describe("sanitizeQuestion", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeQuestion("  apa   kabar   toko?  ")).toBe("apa kabar toko?")
  })

  it("strips control characters", () => {
    expect(sanitizeQuestion("halo\x00\x1f dunia")).toBe("halo dunia")
  })

  it("truncates to 500 characters", () => {
    const long = "a".repeat(600)
    expect(sanitizeQuestion(long)).toHaveLength(500)
  })

  it("coerces non-string/null input to an empty string", () => {
    expect(sanitizeQuestion(null)).toBe("")
    expect(sanitizeQuestion(undefined)).toBe("")
  })
})

describe("isGreetingOnly", () => {
  it.each(["hai", "Halo!", "HALLO", "hi", "selamat pagi", "assalamualaikum", "permisi"])(
    "treats %j as a greeting-only message",
    (msg) => {
      expect(isGreetingOnly(msg)).toBe(true)
    },
  )

  it.each(["halo, ada penggaris?", "berapa harga pulpen", "siapa presiden indonesia"])(
    "does not treat %j (a real question) as greeting-only",
    (msg) => {
      expect(isGreetingOnly(msg)).toBe(false)
    },
  )
})

function emptyContext(overrides: Partial<RetrievedContext> = {}): RetrievedContext {
  return { produk: [], pengetahuan: [], infoToko: {}, laporanAdmin: null, sumber: [], ...overrides }
}

describe("buildTemplateAnswer", () => {
  it("refuses when there is no relevant context at all", () => {
    expect(buildTemplateAnswer("siapa presiden indonesia?", emptyContext())).toBe(REFUSAL_MESSAGE)
  })

  it("lists product info (name, price, stock) when produk is present", () => {
    const ctx = emptyContext({
      produk: [{ nama_barang: "Penggaris 15cm", harga: 5000, stok: 90, satuan: "pcs", kategori: "Sekolah" }],
    })
    const answer = buildTemplateAnswer("berapa harga penggaris", ctx)
    expect(answer).toContain("Penggaris 15cm")
    expect(answer).toContain("5.000")
    expect(answer).toContain("90 pcs")
  })

  it("reports out-of-stock items distinctly", () => {
    const ctx = emptyContext({
      produk: [{ nama_barang: "Kertas HVS", harga: 40000, stok: 0, satuan: "rim", kategori: "Kertas" }],
    })
    expect(buildTemplateAnswer("stok kertas hvs?", ctx)).toContain("stok sedang habis")
  })

  it("includes the product's own deskripsi instead of inventing details", () => {
    const ctx = emptyContext({
      produk: [
        {
          nama_barang: "Buku Gambar & Sketsa",
          harga: 17000,
          stok: 75,
          satuan: "pcs",
          kategori: "Buku & Kertas",
          deskripsi: "Buku untuk seni & kreativitas anak.",
        },
      ],
    })
    expect(buildTemplateAnswer("ada buku gambar?", ctx)).toContain("Buku untuk seni & kreativitas anak.")
  })

  it("includes knowledge-base content when present", () => {
    const ctx = emptyContext({ pengetahuan: [{ judul: "Jam Operasional", konten: "Buka 06.00-21.00" }] })
    expect(buildTemplateAnswer("jam buka jam berapa?", ctx)).toContain("Buka 06.00-21.00")
  })

  it("includes admin report summary when present", () => {
    const ctx = emptyContext({ laporanAdmin: "Omset hari ini: Rp 100.000" })
    expect(buildTemplateAnswer("berapa omset hari ini?", ctx)).toContain("Omset hari ini: Rp 100.000")
  })
})

describe("buildContextText", () => {
  it("is empty when context has nothing", () => {
    expect(buildContextText(emptyContext())).toBe("")
  })

  it("includes a labeled section per populated field", () => {
    const ctx = emptyContext({
      produk: [{ nama_barang: "Pulpen", harga: 4000, stok: 10, satuan: "pcs", kategori: "Alat Tulis" }],
      infoToko: { store_name: "Toko Alat Tulis Agung" },
    })
    const text = buildContextText(ctx)
    expect(text).toContain("DATA PRODUK")
    expect(text).toContain("INFO TOKO")
    expect(text).toContain("Toko Alat Tulis Agung")
  })

  it("passes the product's deskripsi through to the LLM context so it doesn't need to invent one", () => {
    const ctx = emptyContext({
      produk: [
        { nama_barang: "Buku Tulis 38-100 lembar", harga: 10000, stok: 200, satuan: "pcs", kategori: "Buku & Kertas", deskripsi: "Buku tulis untuk sekolah & kuliah." },
      ],
    })
    expect(buildContextText(ctx)).toContain("Buku tulis untuk sekolah & kuliah.")
  })
})

describe("retrieveContext — follow-up question fallback", () => {
  beforeEach(() => {
    queryMock.mockReset()
    embedTextMock.mockReset()
    embedTextMock.mockResolvedValue(null)
  })

  // Mock query yang meniru perilaku ILIKE sungguhan: baris produk hanya
  // dikembalikan kalau salah satu parameter pencarian (kata kunci) memang
  // cocok — supaya test soal "jangan asal nyambung ke topik lama" valid
  // (bukan cuma mengembalikan data apa pun tanpa peduli kata kuncinya).
  function mockDbFor(matchSubstring: string, produkRows: unknown[]) {
    queryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql.includes("FROM barang")) {
        const cocok = (params ?? []).some((p) => String(p).toLowerCase().includes(matchSubstring.toLowerCase()))
        return cocok ? produkRows : []
      }
      if (sql.includes("FROM knowledge_base")) return []
      if (sql.includes("FROM settings")) return []
      return []
    })
  }

  it("finds nothing when the current question has no product keyword and there is no history", async () => {
    mockDbFor("penggaris", [{ nama_barang: "Penggaris 15cm", harga: 5000, stok: 90, satuan: "pcs", kategori: "Sekolah" }])
    const ctx = await retrieveContext("berapa harganya?", false, [])
    expect(ctx.produk).toEqual([])
  })

  it("falls back to the previous question's product when this turn is a bare follow-up (regression test)", async () => {
    // Setelah "apakah penggaris ready?", pertanyaan lanjutan "berapa harganya?"
    // harus tetap mengenali "penggaris".
    mockDbFor("penggaris", [{ nama_barang: "Penggaris 15cm & 30cm", harga: 5000, stok: 90, satuan: "pcs", kategori: "Sekolah" }])
    const ctx = await retrieveContext("berapa harganya?", false, [{ role: "user", text: "apakah penggaris ready?" }])
    expect(ctx.produk).toHaveLength(1)
    expect(ctx.produk[0].nama_barang).toContain("Penggaris")
    expect(ctx.sumber).toContain("database produk (lanjutan topik sebelumnya)")
  })

  it("finds the product directly when the current question names it", async () => {
    mockDbFor("pulpen", [{ nama_barang: "Pulpen berbagai warna", harga: 4000, stok: 120, satuan: "pcs", kategori: "Alat Tulis" }])
    const ctx = await retrieveContext("ada pulpen ga?", false)
    expect(ctx.produk).toHaveLength(1)
    expect(ctx.sumber).toContain("database produk")
  })

  it("keeps tracking the topic across several contentless confirmation turns (regression test)", async () => {
    // Reproduksi persis percakapan yang dilaporkan: "apakah ada buku" -> "boleh"
    // -> "saya mau lihat detailnya" -> "iya" -> "berapa" — di titik "berapa",
    // topik "buku" harus tetap ditemukan meskipun tidak disebutkan lagi sejak
    // giliran pertama, dan meskipun beberapa balasan di antaranya ("boleh",
    // "iya") sama sekali tidak membawa kata kunci sendiri.
    mockDbFor("buku", [
      { nama_barang: "Buku Gambar & Sketsa", harga: 17000, stok: 75, satuan: "pcs", kategori: "Buku & Kertas" },
      { nama_barang: "Buku tulis 38-100 lembar", harga: 10000, stok: 200, satuan: "pcs", kategori: "Buku & Kertas" },
    ])
    const history: Parameters<typeof retrieveContext>[2] = [
      { role: "user", text: "apakah ada buku" },
      { role: "bot", text: "Iya, ada! ..." },
      { role: "user", text: "boleh" },
      { role: "bot", text: "Silakan, ..." },
      { role: "user", text: "saya mau lihat detailnya" },
      { role: "bot", text: "..." },
      { role: "user", text: "iya" },
      { role: "bot", text: "..." },
    ]
    const ctx = await retrieveContext("berapa", false, history)
    expect(ctx.produk.length).toBeGreaterThan(0)
    expect(ctx.produk.some((p) => p.nama_barang.toLowerCase().includes("buku"))).toBe(true)
  })

  it("does NOT carry over the old topic when the current question introduces its own subject", async () => {
    // Kalau pertanyaan saat ini punya kata kunci sendiri (walau bukan nama
    // produk), jangan dipaksa nyambung ke topik lama — biarkan berjalan
    // normal (yang di sini berarti tidak ketemu produk apa pun).
    mockDbFor("buku", [{ nama_barang: "Buku Gambar & Sketsa", harga: 17000, stok: 75, satuan: "pcs", kategori: "Buku & Kertas" }])
    const ctx = await retrieveContext("siapa presiden indonesia", false, [{ role: "user", text: "apakah ada buku" }])
    expect(ctx.produk).toEqual([])
  })

  it("falls back to semantic (embedding) search when keyword search finds nothing", async () => {
    // "alat buat gambar" tidak cocok kata kunci nama produk manapun secara
    // harfiah, tapi embedding tahu ini dekat maknanya dengan pensil warna /
    // cat air — inilah yang membedakan RAG dari sekadar pencarian kata kunci.
    embedTextMock.mockResolvedValueOnce([0.1, 0.2, 0.3])
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM barang") && sql.includes("embedding IS NOT NULL")) {
        return [
          {
            nama_barang: "Pensil warna 12-48 warna",
            harga: 50000,
            stok: 35,
            satuan: "set",
            kategori: "Alat Gambar & Seni",
            distance: 0.3,
          },
        ]
      }
      if (sql.includes("FROM barang")) return [] // keyword search: tidak ketemu
      return []
    })

    const ctx = await retrieveContext("ada alat buat gambar?", false)
    expect(ctx.produk).toHaveLength(1)
    expect(ctx.produk[0].nama_barang).toContain("Pensil warna")
    expect(ctx.sumber).toContain("database produk (pencarian semantic)")
  })

  it("discards semantic matches beyond the distance threshold (not actually relevant)", async () => {
    embedTextMock.mockResolvedValueOnce([0.1, 0.2, 0.3])
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM barang") && sql.includes("embedding IS NOT NULL")) {
        return [
          { nama_barang: "Barang Tidak Nyambung", harga: 1000, stok: 1, satuan: "pcs", kategori: "Lainnya", distance: 0.95 },
        ]
      }
      if (sql.includes("FROM barang")) return []
      return []
    })

    const ctx = await retrieveContext("apakah ada barang xyz random", false)
    expect(ctx.produk).toEqual([])
  })
})

// Sanity check bahwa GREETING_MESSAGE tetap didefinisikan (dipakai app/api/chatbot/route.ts)
describe("GREETING_MESSAGE", () => {
  it("is a non-empty, friendly string", () => {
    expect(GREETING_MESSAGE.length).toBeGreaterThan(0)
  })
})
