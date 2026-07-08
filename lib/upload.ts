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

export interface ValidatedImage {
  buffer: Buffer
  ext: string
  mimeType: string
  fileName: string
  fileSize: number
}

// Mendeteksi format gambar dari isi file (magic bytes), bukan dari header
// Content-Type yang dikirim client (yang mudah dipalsukan).
function detectImageExt(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg" // JPEG
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return ".png" // PNG
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp" // WEBP
  }
  return null
}

// Memvalidasi file (tipe deklarasi client, ukuran, DAN isi sebenarnya lewat
// magic bytes) sekaligus membaca bufernya. Mengembalikan pesan error jika
// tidak valid, atau data terverifikasi yang siap disimpan.
export async function validateImageFile(file: File | null): Promise<{ error: string } | { image: ValidatedImage }> {
  if (!file || file.size === 0) return { error: "File gambar wajib dipilih" }
  if (!ALLOWED_TYPES[file.type]) {
    return { error: "Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP" }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Ukuran file maksimal 2MB" }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detectedExt = detectImageExt(buffer)
  const expectedExt = ALLOWED_TYPES[file.type]
  if (!detectedExt || detectedExt !== expectedExt) {
    return { error: "Isi file tidak sesuai format gambar yang didukung (JPG, PNG, atau WEBP)" }
  }

  return {
    image: { buffer, ext: expectedExt, mimeType: file.type, fileName: file.name, fileSize: file.size },
  }
}

// Menyimpan file gambar (sudah tervalidasi) dan mengembalikan info file (termasuk URL publiknya)
export async function saveImageFile(image: ValidatedImage, subdir: string): Promise<SavedUpload> {
  const { buffer, ext, mimeType, fileName, fileSize } = image
  const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`

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
        "Content-Type": mimeType,
        "cache-control": "3600",
      },
      body: new Uint8Array(buffer),
    })
    if (!response.ok) {
      throw new Error(`Gagal mengunggah ke Supabase Storage: ${response.status} ${await response.text()}`)
    }
    return {
      publicPath: `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`,
      fileName,
      fileSize,
      mimeType,
    }
  }

  // --- Mode 2: Filesystem lokal (development) ---
  const dir = path.join(process.cwd(), "public", "uploads", subdir)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, safeName), buffer)
  return {
    publicPath: `/uploads/${subdir}/${safeName}`,
    fileName,
    fileSize,
    mimeType,
  }
}
