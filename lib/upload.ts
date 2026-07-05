// Helper penyimpanan file gambar yang diunggah (bukti pembayaran & QRIS).
// Validasi: hanya jpg/jpeg/png/webp, ukuran maksimal 2MB.
//
// Dua mode penyimpanan:
//   1. Supabase Storage (dipakai saat deploy) — aktif bila SUPABASE_URL &
//      SUPABASE_SERVICE_ROLE_KEY diatur. Filesystem serverless (Vercel)
//      bersifat read-only sehingga file harus disimpan di object storage.
//   2. Filesystem lokal public/uploads (fallback saat development) — aktif
//      bila variabel Supabase Storage tidak diatur.
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 // 2MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

export interface SavedUpload {
  publicPath: string // URL/path publik yang disimpan ke database
  fileName: string
  fileSize: number
  mimeType: string
}

// Mengembalikan pesan error (string) jika tidak valid, atau null jika valid
export function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) return "File gambar wajib dipilih"
  if (!ALLOWED_TYPES[file.type]) {
    return "Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP"
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Ukuran file maksimal 2MB"
  }
  return null
}

// Menyimpan file gambar dan mengembalikan info file (termasuk URL publiknya)
export async function saveImageFile(file: File, subdir: string): Promise<SavedUpload> {
  const ext = ALLOWED_TYPES[file.type]
  const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads"

  // --- Mode 1: Supabase Storage (production/deploy) ---
  if (supabaseUrl && serviceKey) {
    const objectPath = `${subdir}/${safeName}`
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": file.type,
        "cache-control": "3600",
      },
      body: buffer,
    })
    if (!response.ok) {
      throw new Error(`Gagal mengunggah ke Supabase Storage: ${response.status} ${await response.text()}`)
    }
    return {
      publicPath: `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }
  }

  // --- Mode 2: Filesystem lokal (development) ---
  const dir = path.join(process.cwd(), "public", "uploads", subdir)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, safeName), buffer)
  return {
    publicPath: `/uploads/${subdir}/${safeName}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }
}
