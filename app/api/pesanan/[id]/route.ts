// GET   /api/pesanan/[id] — detail pesanan (pemilik pesanan atau admin)
// PATCH /api/pesanan/[id] — membatalkan pesanan selama masih menunggu pembayaran
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const { id } = await params
    const rows = await query(
      `SELECT t.id, t.no_faktur, t.tanggal, t.total_item, t.user_id,
              t.total_harga::float8 AS total_harga, t.metode_pembayaran, t.status, t.catatan,
              COALESCE(u.nama_lengkap, 'Pelanggan Toko') AS nama_pembeli,
              p.id AS payment_id, p.status AS status_pembayaran,
              p.alasan_penolakan, p.verified_at,
              (SELECT json_agg(json_build_object(
                 'nama_barang', ti.nama_barang, 'jumlah', ti.jumlah,
                 'harga_satuan', ti.harga_satuan::float8, 'subtotal', ti.subtotal::float8))
               FROM transaction_items ti WHERE ti.transaction_id = t.id) AS items,
              (SELECT json_agg(json_build_object(
                 'file_path', pp.file_path, 'uploaded_at', pp.uploaded_at)
                 ORDER BY pp.uploaded_at DESC)
               FROM payment_proofs pp WHERE pp.payment_id = p.id) AS bukti
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN payments p ON p.transaction_id = t.id
       WHERE t.id = $1`,
      [Number(id)],
    )

    const pesanan = rows[0]
    if (!pesanan) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan" }, { status: 404 })
    }
    // Hanya pemilik pesanan atau admin yang boleh melihat detail
    if (user.role !== "admin" && pesanan.user_id !== user.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 })
    }

    return NextResponse.json({ record: pesanan })
  } catch (err) {
    console.error("Pesanan detail error:", err)
    return NextResponse.json({ message: "Gagal memuat detail pesanan" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    if (body.action !== "batalkan") {
      return NextResponse.json({ message: "Aksi tidak dikenal" }, { status: 400 })
    }

    // Pembatalan hanya boleh oleh pemilik dan selama belum dibayar
    const result = await query(
      `UPDATE transactions
       SET status = 'dibatalkan', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'menunggu_pembayaran'
       RETURNING id`,
      [Number(id), user.id],
    )
    if (result.length === 0) {
      return NextResponse.json(
        { message: "Pesanan tidak bisa dibatalkan (mungkin sudah dibayar atau bukan milik Anda)" },
        { status: 400 },
      )
    }
    await query(
      "UPDATE payments SET status = 'dibatalkan', updated_at = NOW() WHERE transaction_id = $1",
      [Number(id)],
    )

    return NextResponse.json({ message: "Pesanan berhasil dibatalkan" })
  } catch (err) {
    console.error("Pesanan cancel error:", err)
    return NextResponse.json({ message: "Gagal membatalkan pesanan" }, { status: 500 })
  }
}
