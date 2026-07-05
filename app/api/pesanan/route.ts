// GET /api/pesanan — daftar pesanan milik user yang sedang login
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const records = await query(
      `SELECT t.id, t.no_faktur, t.tanggal, t.total_item,
              t.total_harga::float8 AS total_harga, t.metode_pembayaran, t.status,
              p.status AS status_pembayaran, p.alasan_penolakan
       FROM transactions t
       LEFT JOIN payments p ON p.transaction_id = t.id
       WHERE t.user_id = $1
       ORDER BY t.tanggal DESC`,
      [user.id],
    )

    return NextResponse.json({ records })
  } catch (err) {
    console.error("Pesanan GET error:", err)
    return NextResponse.json({ message: "Gagal memuat daftar pesanan" }, { status: 500 })
  }
}
