// Penyusun data laporan untuk fitur export PDF & Excel.
// Tiga jenis laporan: transaksi, stok barang, dan pembayaran.
// Setiap laporan berisi: judul, tanggal export, header kolom, baris data,
// dan ringkasan (dipakai oleh generator PDF maupun Excel).
import { query } from "@/lib/db"

export type JenisLaporan = "transaksi" | "stok" | "pembayaran"

export interface ReportData {
  judul: string
  periode: string | null
  kolom: string[]
  baris: (string | number)[][]
  ringkasan: { label: string; nilai: string }[]
}

function formatRupiah(nilai: number): string {
  return `Rp ${Number(nilai).toLocaleString("id-ID")}`
}

function formatTanggal(tanggal: Date | string): string {
  return new Date(tanggal).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Kondisi rentang tanggal yang sama untuk laporan transaksi & pembayaran
function dateFilter(startDate: string | null, endDate: string | null, kolom: string) {
  const conditions: string[] = []
  const params: unknown[] = []
  if (startDate) {
    params.push(startDate)
    conditions.push(`${kolom} >= $${params.length}::date`)
  }
  if (endDate) {
    params.push(endDate)
    conditions.push(`${kolom} < ($${params.length}::date + INTERVAL '1 day')`)
  }
  return { where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "", params }
}

function labelPeriode(startDate: string | null, endDate: string | null): string | null {
  if (!startDate && !endDate) return null
  return `Periode: ${startDate ?? "awal"} s/d ${endDate ?? "sekarang"}`
}

export async function buildLaporanTransaksi(startDate: string | null, endDate: string | null): Promise<ReportData> {
  const { where, params } = dateFilter(startDate, endDate, "t.tanggal")
  const rows = await query(
    `SELECT t.no_faktur, t.tanggal, COALESCE(u.nama_lengkap, 'Pelanggan Toko') AS pembeli,
            t.metode_pembayaran, t.status, t.total_item, t.total_harga::float8 AS total_harga
     FROM transactions t
     LEFT JOIN users u ON u.id = t.user_id
     ${where}
     ORDER BY t.tanggal DESC`,
    params,
  )

  const totalOmset = rows.filter((r) => r.status === "lunas").reduce((sum, r) => sum + r.total_harga, 0)
  return {
    judul: "Laporan Transaksi - Toko Alat Tulis Agung",
    periode: labelPeriode(startDate, endDate),
    kolom: ["No. Faktur", "Tanggal", "Pembeli", "Metode", "Status", "Jumlah Item", "Total"],
    baris: rows.map((r) => [
      r.no_faktur,
      formatTanggal(r.tanggal),
      r.pembeli,
      r.metode_pembayaran,
      r.status,
      r.total_item,
      formatRupiah(r.total_harga),
    ]),
    ringkasan: [
      { label: "Total Transaksi", nilai: `${rows.length} transaksi` },
      { label: "Transaksi Lunas", nilai: `${rows.filter((r) => r.status === "lunas").length} transaksi` },
      { label: "Total Omset (Lunas)", nilai: formatRupiah(totalOmset) },
    ],
  }
}

export async function buildLaporanStok(): Promise<ReportData> {
  const rows = await query(
    `SELECT b.kode_barang, b.nama_barang, COALESCE(k.nama_kategori, 'Tanpa Kategori') AS kategori,
            b.harga::float8 AS harga, b.stok, b.stok_minimum, b.satuan, b.status
     FROM barang b
     LEFT JOIN kategori k ON k.id = b.kategori_id
     ORDER BY b.nama_barang`,
  )

  const nilaiStok = rows.reduce((sum, r) => sum + r.harga * r.stok, 0)
  const stokMenipis = rows.filter((r) => r.stok <= r.stok_minimum).length
  return {
    judul: "Laporan Stok Barang - Toko Alat Tulis Agung",
    periode: null,
    kolom: ["Kode", "Nama Barang", "Kategori", "Harga", "Stok", "Stok Min.", "Satuan", "Status"],
    baris: rows.map((r) => [
      r.kode_barang,
      r.nama_barang,
      r.kategori,
      formatRupiah(r.harga),
      r.stok,
      r.stok_minimum,
      r.satuan,
      r.status,
    ]),
    ringkasan: [
      { label: "Jumlah Jenis Barang", nilai: `${rows.length} barang` },
      { label: "Barang Stok Menipis", nilai: `${stokMenipis} barang` },
      { label: "Total Nilai Stok", nilai: formatRupiah(nilaiStok) },
    ],
  }
}

export async function buildLaporanPembayaran(startDate: string | null, endDate: string | null): Promise<ReportData> {
  const { where, params } = dateFilter(startDate, endDate, "p.created_at")
  const rows = await query(
    `SELECT t.no_faktur, p.created_at, COALESCE(u.nama_lengkap, 'Pelanggan Toko') AS pembeli,
            p.metode, p.jumlah::float8 AS jumlah, p.status,
            COALESCE(a.nama_lengkap, '-') AS diverifikasi_oleh, p.verified_at
     FROM payments p
     JOIN transactions t ON t.id = p.transaction_id
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN users a ON a.id = p.verified_by
     ${where}
     ORDER BY p.created_at DESC`,
    params,
  )

  const totalLunas = rows.filter((r) => r.status === "lunas").reduce((sum, r) => sum + r.jumlah, 0)
  return {
    judul: "Laporan Pembayaran - Toko Alat Tulis Agung",
    periode: labelPeriode(startDate, endDate),
    kolom: ["No. Faktur", "Tanggal", "Pembeli", "Metode", "Jumlah", "Status", "Diverifikasi Oleh", "Tgl. Verifikasi"],
    baris: rows.map((r) => [
      r.no_faktur,
      formatTanggal(r.created_at),
      r.pembeli,
      r.metode,
      formatRupiah(r.jumlah),
      r.status,
      r.diverifikasi_oleh,
      r.verified_at ? formatTanggal(r.verified_at) : "-",
    ]),
    ringkasan: [
      { label: "Total Pembayaran", nilai: `${rows.length} pembayaran` },
      { label: "Menunggu Verifikasi", nilai: `${rows.filter((r) => r.status === "menunggu_verifikasi").length} pembayaran` },
      { label: "Total Diterima (Lunas)", nilai: formatRupiah(totalLunas) },
    ],
  }
}

export async function buildReport(
  jenis: JenisLaporan,
  startDate: string | null,
  endDate: string | null,
): Promise<ReportData> {
  if (jenis === "stok") return buildLaporanStok()
  if (jenis === "pembayaran") return buildLaporanPembayaran(startDate, endDate)
  return buildLaporanTransaksi(startDate, endDate)
}
