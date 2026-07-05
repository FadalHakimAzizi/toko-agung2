// GET /api/dashboard/summary — ringkasan dashboard (pengganti dashboard/summary.php)
// Hanya transaksi berstatus 'lunas' yang dihitung sebagai omset.
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const [row] = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM barang WHERE status = 'aktif') AS total_produk,
        (SELECT COUNT(*)::int FROM transactions
          WHERE status = 'lunas' AND tanggal::date = CURRENT_DATE) AS transaksi_hari_ini,
        (SELECT COALESCE(SUM(total_harga), 0)::float8 FROM transactions
          WHERE status = 'lunas' AND tanggal::date = CURRENT_DATE) AS omset_hari_ini,
        (SELECT COALESCE(SUM(total_harga), 0)::float8 FROM transactions
          WHERE status = 'lunas' AND tanggal::date = CURRENT_DATE - 1) AS omset_kemarin,
        (SELECT COALESCE(SUM(total_harga), 0)::float8 FROM transactions
          WHERE status = 'lunas' AND date_trunc('month', tanggal) = date_trunc('month', NOW())) AS omset_bulan_ini,
        (SELECT COUNT(*)::int FROM payments WHERE status = 'menunggu_verifikasi') AS menunggu_verifikasi
    `)

    const change =
      row.omset_kemarin > 0
        ? Math.round(((row.omset_hari_ini - row.omset_kemarin) / row.omset_kemarin) * 100)
        : row.omset_hari_ini > 0
          ? 100
          : 0

    return NextResponse.json({
      total_produk: row.total_produk,
      transaksi_hari_ini: row.transaksi_hari_ini,
      omset_hari_ini: row.omset_hari_ini,
      omset_percentage_change: change,
      omset_bulan_ini: row.omset_bulan_ini,
      menunggu_verifikasi: row.menunggu_verifikasi,
    })
  } catch (err) {
    console.error("Dashboard summary error:", err)
    return NextResponse.json({ message: "Gagal memuat ringkasan dashboard" }, { status: 500 })
  }
}
