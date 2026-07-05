// POST /api/verifikasi/[id] — admin menyetujui/menolak pembayaran (id = id transaksi).
// Body: { action: "setujui" } atau { action: "tolak", alasan: "..." }
// PENTING: stok barang baru berkurang di sini, saat pembayaran DISETUJUI —
// bukan saat checkout — sesuai kebutuhan skripsi.
import { NextResponse } from "next/server"
import { withTransaction } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { id } = await params
    const trxId = Number(id)
    const body = await request.json()
    const action = body.action

    if (action !== "setujui" && action !== "tolak") {
      return NextResponse.json({ message: "Aksi harus 'setujui' atau 'tolak'" }, { status: 400 })
    }
    const alasan = typeof body.alasan === "string" ? body.alasan.trim().slice(0, 500) : ""
    if (action === "tolak" && !alasan) {
      return NextResponse.json({ message: "Alasan penolakan wajib diisi" }, { status: 400 })
    }

    const message = await withTransaction(async (client) => {
      // Kunci baris pembayaran agar tidak diverifikasi dua kali bersamaan
      const { rows } = await client.query(
        `SELECT p.id AS payment_id, p.status
         FROM payments p WHERE p.transaction_id = $1 FOR UPDATE`,
        [trxId],
      )
      const payment = rows[0]
      if (!payment) throw new Error("Data pembayaran tidak ditemukan")
      if (payment.status !== "menunggu_verifikasi") {
        throw new Error(`Pembayaran tidak dalam status menunggu verifikasi (status: ${payment.status})`)
      }

      if (action === "tolak") {
        await client.query(
          `UPDATE payments SET status = 'ditolak', alasan_penolakan = $1,
                  verified_by = $2, verified_at = NOW(), updated_at = NOW()
           WHERE id = $3`,
          [alasan, admin.id, payment.payment_id],
        )
        await client.query(
          "UPDATE transactions SET status = 'ditolak', updated_at = NOW() WHERE id = $1",
          [trxId],
        )
        return "Pembayaran ditolak. Pembeli dapat mengunggah ulang bukti yang benar."
      }

      // action === "setujui": validasi & kurangi stok secara atomik
      const { rows: items } = await client.query(
        `SELECT ti.barang_id, ti.nama_barang, ti.jumlah
         FROM transaction_items ti WHERE ti.transaction_id = $1`,
        [trxId],
      )
      for (const item of items) {
        if (!item.barang_id) continue // barang sudah dihapus dari master
        const { rowCount } = await client.query(
          "UPDATE barang SET stok = stok - $1, updated_at = NOW() WHERE id = $2 AND stok >= $1",
          [item.jumlah, item.barang_id],
        )
        if (rowCount === 0) {
          throw new Error(
            `Stok "${item.nama_barang}" tidak mencukupi untuk memenuhi pesanan. Tolak pembayaran atau tambah stok terlebih dahulu.`,
          )
        }
      }

      await client.query(
        `UPDATE payments SET status = 'lunas', verified_by = $1, verified_at = NOW(),
                alasan_penolakan = NULL, updated_at = NOW()
         WHERE id = $2`,
        [admin.id, payment.payment_id],
      )
      await client.query(
        "UPDATE transactions SET status = 'lunas', updated_at = NOW() WHERE id = $1",
        [trxId],
      )
      return "Pembayaran disetujui. Transaksi lunas dan stok barang telah dikurangi."
    })

    return NextResponse.json({ message })
  } catch (err) {
    console.error("Verifikasi POST error:", err)
    const message = err instanceof Error ? err.message : "Gagal memproses verifikasi"
    return NextResponse.json({ message }, { status: 400 })
  }
}
