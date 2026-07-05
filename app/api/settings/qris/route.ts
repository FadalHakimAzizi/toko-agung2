// POST /api/settings/qris — admin mengunggah gambar QRIS toko (multipart/form-data)
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { validateImageFile, saveImageFile } from "@/lib/upload"

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const fileError = validateImageFile(file instanceof File ? file : null)
    if (fileError) {
      return NextResponse.json({ message: fileError }, { status: 400 })
    }

    const saved = await saveImageFile(file as File, "qris")
    await query(
      `INSERT INTO settings (key, value) VALUES ('qris_image', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [saved.publicPath],
    )

    return NextResponse.json({ message: "Gambar QRIS berhasil diperbarui", qris_image: saved.publicPath })
  } catch (err) {
    console.error("QRIS upload error:", err)
    return NextResponse.json({ message: "Gagal mengunggah gambar QRIS" }, { status: 500 })
  }
}
