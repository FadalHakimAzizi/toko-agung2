// API Pengaturan toko (key-value di tabel settings)
// GET /api/settings — publik (dipakai halaman pembayaran QRIS & chatbot)
// PUT /api/settings — admin, body: { store_name: "...", ... }
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

const ALLOWED_KEYS = [
  "store_name",
  "store_address",
  "store_phone",
  "store_email",
  "store_hours",
  "qris_image",
]

export async function GET() {
  try {
    const rows = await query("SELECT key, value FROM settings")
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
    return NextResponse.json({ settings })
  } catch (err) {
    console.error("Settings GET error:", err)
    return NextResponse.json({ message: "Gagal memuat pengaturan" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const body = await request.json()
    for (const key of ALLOWED_KEYS) {
      if (typeof body[key] === "string") {
        await query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, body[key].slice(0, 1000)],
        )
      }
    }

    return NextResponse.json({ message: "Pengaturan berhasil disimpan" })
  } catch (err) {
    console.error("Settings PUT error:", err)
    return NextResponse.json({ message: "Gagal menyimpan pengaturan" }, { status: 500 })
  }
}
