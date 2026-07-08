// POST /api/barang/gambar — admin mengunggah gambar barang (multipart/form-data).
// Mengembalikan path publik gambar; disimpan lewat POST/PUT /api/barang (field `gambar`).
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { validateImageFile, saveImageFile } from "@/lib/upload"

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const validated = await validateImageFile(file instanceof File ? file : null)
    if ("error" in validated) {
      return NextResponse.json({ message: validated.error }, { status: 400 })
    }

    const saved = await saveImageFile(validated.image, "barang")
    return NextResponse.json({ message: "Gambar berhasil diunggah", gambar: saved.publicPath })
  } catch (err) {
    console.error("Upload gambar barang error:", err)
    return NextResponse.json({ message: "Gagal mengunggah gambar barang" }, { status: 500 })
  }
}
