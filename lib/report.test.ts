import { describe, it, expect, vi, beforeEach } from "vitest"

const queryMock = vi.fn()
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const { buildLaporanTransaksi, buildLaporanStok, buildLaporanPembayaran } = await import("@/lib/report")

describe("buildLaporanTransaksi", () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it("computes correct totals: only 'lunas' rows count toward omset", async () => {
    queryMock.mockResolvedValueOnce([
      {
        no_faktur: "INV-1", tanggal: "2026-01-05T10:00:00Z", pembeli: "Budi",
        metode_pembayaran: "QRIS", status: "lunas", total_item: 2, total_harga: 15000,
      },
      {
        no_faktur: "INV-2", tanggal: "2026-01-06T10:00:00Z", pembeli: "Ani",
        metode_pembayaran: "Tunai", status: "menunggu_verifikasi", total_item: 1, total_harga: 5000,
      },
    ])

    const report = await buildLaporanTransaksi("2026-01-01", "2026-01-31")

    expect(report.baris).toHaveLength(2)
    expect(report.ringkasan).toEqual([
      { label: "Total Transaksi", nilai: "2 transaksi" },
      { label: "Transaksi Lunas", nilai: "1 transaksi" },
      // Hanya INV-1 (lunas) yang dihitung, bukan 15000 + 5000
      { label: "Total Omset (Lunas)", nilai: "Rp 15.000" },
    ])
  })

  it("passes the date range through to the query as filter params", async () => {
    queryMock.mockResolvedValueOnce([])
    await buildLaporanTransaksi("2026-02-01", "2026-02-28")
    const params = queryMock.mock.calls[0][1]
    expect(params).toEqual(["2026-02-01", "2026-02-28"])
  })

  it("has no periode label when no date range is given", async () => {
    queryMock.mockResolvedValueOnce([])
    const report = await buildLaporanTransaksi(null, null)
    expect(report.periode).toBeNull()
  })
})

describe("buildLaporanStok", () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it("computes total stock value and low-stock count correctly", async () => {
    queryMock.mockResolvedValueOnce([
      { kode_barang: "BRG-0001", nama_barang: "Pulpen", kategori: "Alat Tulis", harga: 4000, stok: 5, stok_minimum: 10, satuan: "pcs", status: "aktif" },
      { kode_barang: "BRG-0002", nama_barang: "Pensil", kategori: "Alat Tulis", harga: 3000, stok: 50, stok_minimum: 10, satuan: "pcs", status: "aktif" },
    ])

    const report = await buildLaporanStok()

    // nilaiStok = 4000*5 + 3000*50 = 20.000 + 150.000 = 170.000
    // stokMenipis = 1 (Pulpen: stok 5 <= stok_minimum 10)
    expect(report.ringkasan).toEqual([
      { label: "Jumlah Jenis Barang", nilai: "2 barang" },
      { label: "Barang Stok Menipis", nilai: "1 barang" },
      { label: "Total Nilai Stok", nilai: "Rp 170.000" },
    ])
  })
})

describe("buildLaporanPembayaran", () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it("sums only 'lunas' payments for the received total", async () => {
    queryMock.mockResolvedValueOnce([
      { no_faktur: "INV-1", created_at: "2026-01-05T10:00:00Z", pembeli: "Budi", metode: "QRIS", jumlah: 15000, status: "lunas", diverifikasi_oleh: "Admin", verified_at: "2026-01-05T11:00:00Z" },
      { no_faktur: "INV-2", created_at: "2026-01-06T10:00:00Z", pembeli: "Ani", metode: "QRIS", jumlah: 5000, status: "menunggu_verifikasi", diverifikasi_oleh: "-", verified_at: null },
    ])

    const report = await buildLaporanPembayaran("2026-01-01", "2026-01-31")

    expect(report.ringkasan).toEqual([
      { label: "Total Pembayaran", nilai: "2 pembayaran" },
      { label: "Menunggu Verifikasi", nilai: "1 pembayaran" },
      { label: "Total Diterima (Lunas)", nilai: "Rp 15.000" },
    ])
  })
})
