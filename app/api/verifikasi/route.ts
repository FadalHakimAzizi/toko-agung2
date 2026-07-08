// GET /api/verifikasi — daftar transaksi untuk diverifikasi admin.
// ?status=menunggu_verifikasi (default) | semua status pembayaran QRIS lainnya
// ?page=&limit= opsional — tanpa itu, kembalikan seluruh data (perilaku lama).
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { parsePagination, buildPaginationMeta, splitCountedRows } from "@/lib/pagination"

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "menunggu_verifikasi"
    const isPaginated = searchParams.has("page") || searchParams.has("limit")

    const params: unknown[] = []
    let where = "WHERE t.metode_pembayaran = 'QRIS'"
    if (status !== "semua") {
      params.push(status)
      where += ` AND p.status = $${params.length}`
    }

    const baseFields = `t.id, t.no_faktur, t.tanggal, t.total_item,
              t.total_harga::float8 AS total_harga, t.status,
              p.id AS payment_id, p.status AS status_pembayaran, p.alasan_penolakan,
              COALESCE(u.nama_lengkap, 'Pelanggan Toko') AS nama_pembeli,
              (SELECT COUNT(*)::int FROM payment_proofs pp WHERE pp.payment_id = p.id) AS jumlah_bukti`
    const fromClause = `FROM transactions t JOIN payments p ON p.transaction_id = t.id LEFT JOIN users u ON u.id = t.user_id`

    if (!isPaginated) {
      const records = await query(
        `SELECT ${baseFields} ${fromClause} ${where} ORDER BY t.tanggal DESC`,
        params,
      )
      return NextResponse.json({ records })
    }

    const { page, limit, offset } = parsePagination(searchParams)
    const rows = await query(
      `SELECT ${baseFields}, COUNT(*) OVER() AS total_count
       ${fromClause} ${where}
       ORDER BY t.tanggal DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )
    const { records, total } = splitCountedRows(rows)
    return NextResponse.json({ records, pagination: buildPaginationMeta(page, limit, total) })
  } catch (err) {
    console.error("Verifikasi GET error:", err)
    return NextResponse.json({ message: "Gagal memuat daftar verifikasi" }, { status: 500 })
  }
}
