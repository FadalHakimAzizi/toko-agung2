// GET /api/laporan/top-products — 5 produk terlaris (pengganti laporan/top_products.php)
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const records = await query(`
      SELECT ti.nama_barang AS name,
             COALESCE(k.nama_kategori, 'Tanpa Kategori') AS category,
             SUM(ti.jumlah)::int AS sold,
             SUM(ti.subtotal)::float8 AS revenue
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id AND t.status = 'lunas'
      LEFT JOIN barang b ON b.id = ti.barang_id
      LEFT JOIN kategori k ON k.id = b.kategori_id
      GROUP BY ti.nama_barang, k.nama_kategori
      ORDER BY sold DESC
      LIMIT 5
    `)

    return NextResponse.json({ records })
  } catch (err) {
    console.error("Top products error:", err)
    return NextResponse.json({ message: "Gagal memuat produk terlaris" }, { status: 500 })
  }
}
