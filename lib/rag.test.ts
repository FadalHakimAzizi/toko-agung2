import { describe, it, expect, vi, beforeEach } from "vitest"
import type { RetrievedContext } from "@/lib/rag"

const queryMock = vi.fn()
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }))
// Embedding tidak dikonfigurasi di test — memaksa retrieveContext lewat jalur
// keyword search (fallback), bukan pencarian semantic pgvector.
vi.mock("@/lib/embedding", () => ({
  embedText: vi.fn().mockResolvedValue(null),
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
})

describe("retrieveContext — follow-up question fallback", () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  // Mock query untuk merespons berbeda tergantung tabel yang di-SELECT, supaya
  // tidak bergantung pada urutan pemanggilan yang persis (lebih tahan terhadap
  // perubahan kecil di implementasi retrieveContext).
  function mockDbFor(produkRows: unknown[]) {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM barang")) return produkRows
      if (sql.includes("FROM knowledge_base")) return []
      if (sql.includes("FROM settings")) return []
      return []
    })
  }

  it("finds nothing when the current question has no product keyword and there is no prior question", async () => {
    mockDbFor([{ nama_barang: "Penggaris 15cm", harga: 5000, stok: 90, satuan: "pcs", kategori: "Sekolah" }])
    const ctx = await retrieveContext("berapa harganya?", false, "")
    expect(ctx.produk).toEqual([])
  })

  it("falls back to the previous question's product when this turn is a bare follow-up (regression test)", async () => {
    // Ini persis kasus yang dilaporkan: setelah "apakah penggaris ready?",
    // pertanyaan lanjutan "berapa harganya?" harus tetap mengenali "penggaris".
    mockDbFor([{ nama_barang: "Penggaris 15cm & 30cm", harga: 5000, stok: 90, satuan: "pcs", kategori: "Sekolah" }])
    const ctx = await retrieveContext("berapa harganya?", false, "apakah penggaris ready?")
    expect(ctx.produk).toHaveLength(1)
    expect(ctx.produk[0].nama_barang).toContain("Penggaris")
    expect(ctx.sumber).toContain("database produk (lanjutan topik sebelumnya)")
  })

  it("finds the product directly when the current question names it", async () => {
    mockDbFor([{ nama_barang: "Pulpen berbagai warna", harga: 4000, stok: 120, satuan: "pcs", kategori: "Alat Tulis" }])
    const ctx = await retrieveContext("ada pulpen ga?", false)
    expect(ctx.produk).toHaveLength(1)
    expect(ctx.sumber).toContain("database produk")
  })
})

// Sanity check bahwa GREETING_MESSAGE tetap didefinisikan (dipakai app/api/chatbot/route.ts)
describe("GREETING_MESSAGE", () => {
  it("is a non-empty, friendly string", () => {
    expect(GREETING_MESSAGE.length).toBeGreaterThan(0)
  })
})
