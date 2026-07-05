// GET /api/kategori — daftar kategori barang (pengganti kategori/read.php)
import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const records = await query(
      "SELECT id, nama_kategori, deskripsi FROM kategori ORDER BY nama_kategori",
    )
    return NextResponse.json({ records })
  } catch (err) {
    console.error("Kategori GET error:", err)
    return NextResponse.json({ message: "Gagal memuat data kategori" }, { status: 500 })
  }
}
