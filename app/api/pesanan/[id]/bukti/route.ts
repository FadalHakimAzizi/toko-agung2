// POST /api/pesanan/[id]/bukti — unggah bukti pembayaran (multipart/form-data).
// Format yang diizinkan: jpg, jpeg, png, webp; maksimal 2MB.
// Setelah bukti diunggah, status pembayaran & transaksi menjadi 'menunggu_verifikasi'.
import { NextResponse } from "next/server"
import { query, withTransaction } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { validateImageFile, saveImageFile } from "@/lib/upload"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const { id } = await params
    const trxId = Number(id)

    // Pastikan pesanan milik user (admin juga boleh membantu mengunggah)
    const rows = await query(
      `SELECT t.id, t.user_id, t.status AS status_transaksi, p.id AS payment_id, p.status AS status_pembayaran
       FROM transactions t
       JOIN payments p ON p.transaction_id = t.id
       WHERE t.id = $1`,
      [trxId],
    )
    const pesanan = rows[0]
    if (!pesanan) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan" }, { status: 404 })
    }
    if (user.role !== "admin" && pesanan.user_id !== user.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 })
    }
    // Bukti hanya bisa diunggah saat menunggu pembayaran, menunggu verifikasi
    // (mengganti bukti), atau setelah ditolak (mengunggah ulang)
    const bolehUpload = ["menunggu_pembayaran", "menunggu_verifikasi", "ditolak"]
    if (!bolehUpload.includes(pesanan.status_pembayaran)) {
      return NextResponse.json(
        { message: `Bukti tidak dapat diunggah karena status pembayaran: ${pesanan.status_pembayaran}` },
        { status: 400 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const fileError = validateImageFile(file instanceof File ? file : null)
    if (fileError) {
      return NextResponse.json({ message: fileError }, { status: 400 })
    }

    const saved = await saveImageFile(file as File, "bukti")

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO payment_proofs (payment_id, file_path, file_name, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [pesanan.payment_id, saved.publicPath, saved.fileName, saved.fileSize, saved.mimeType],
      )
      await client.query(
        `UPDATE payments SET status = 'menunggu_verifikasi', alasan_penolakan = NULL, updated_at = NOW()
         WHERE id = $1`,
        [pesanan.payment_id],
      )
      await client.query(
        "UPDATE transactions SET status = 'menunggu_verifikasi', updated_at = NOW() WHERE id = $1",
        [trxId],
      )
    })

    return NextResponse.json({
      message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.",
      file_path: saved.publicPath,
    })
  } catch (err) {
    console.error("Upload bukti error:", err)
    return NextResponse.json({ message: "Gagal mengunggah bukti pembayaran" }, { status: 500 })
  }
}
