// GET /api/verifikasi — daftar transaksi untuk diverifikasi admin.
// ?status=menunggu_verifikasi (default) | semua status pembayaran QRIS lainnya
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "menunggu_verifikasi"

    const params: unknown[] = []
    let where = "WHERE t.metode_pembayaran = 'QRIS'"
    if (status !== "semua") {
      params.push(status)
      where += ` AND p.status = $${params.length}`
    }

    const records = await query(
      `SELECT t.id, t.no_faktur, t.tanggal, t.total_item,
              t.total_harga::float8 AS total_harga, t.status,
              p.id AS payment_id, p.status AS status_pembayaran, p.alasan_penolakan,
              COALESCE(u.nama_lengkap, 'Pelanggan Toko') AS nama_pembeli,
              (SELECT COUNT(*)::int FROM payment_proofs pp WHERE pp.payment_id = p.id) AS jumlah_bukti
       FROM transactions t
       JOIN payments p ON p.transaction_id = t.id
       LEFT JOIN users u ON u.id = t.user_id
       ${where}
       ORDER BY t.tanggal DESC`,
      params,
    )

    return NextResponse.json({ records })
  } catch (err) {
    console.error("Verifikasi GET error:", err)
    return NextResponse.json({ message: "Gagal memuat daftar verifikasi" }, { status: 500 })
  }
}
