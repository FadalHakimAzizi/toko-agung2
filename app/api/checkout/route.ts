// POST /api/checkout — membuat pesanan online (QRIS) dari keranjang pembeli.
// Stok hanya DIVALIDASI di sini, belum dikurangi. Stok baru berkurang
// setelah pembayaran diverifikasi/disetujui admin (lihat /api/verifikasi).
import { NextResponse } from "next/server"
import { withTransaction } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

interface CheckoutItem {
  id: number
  quantity: number
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu untuk checkout" }, { status: 401 })
    }

    const body = await request.json()
    const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : []
    const catatan = typeof body.catatan === "string" ? body.catatan.slice(0, 500) : null

    if (items.length === 0) {
      return NextResponse.json({ message: "Keranjang masih kosong" }, { status: 400 })
    }
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ message: "Jumlah barang tidak boleh kosong atau minus" }, { status: 400 })
      }
    }

    const result = await withTransaction(async (client) => {
      let totalHarga = 0
      let totalItem = 0
      const detail: { barang_id: number; nama: string; harga: number; jumlah: number; subtotal: number }[] = []

      // Validasi stok — harga selalu diambil dari database, bukan dari client
      for (const item of items) {
        const { rows } = await client.query(
          "SELECT id, nama_barang, harga::float8 AS harga, stok, status FROM barang WHERE id = $1",
          [Number(item.id)],
        )
        const barang = rows[0]
        if (!barang || barang.status !== "aktif") {
          throw new Error(`Barang tidak ditemukan atau sudah tidak aktif`)
        }
        if (barang.stok < item.quantity) {
          throw new Error(`Stok "${barang.nama_barang}" tidak mencukupi (tersisa ${barang.stok})`)
        }
        const subtotal = barang.harga * item.quantity
        totalHarga += subtotal
        totalItem += item.quantity
        detail.push({ barang_id: barang.id, nama: barang.nama_barang, harga: barang.harga, jumlah: item.quantity, subtotal })
      }

      // Buat transaksi berstatus 'menunggu_pembayaran'
      const { rows: trxRows } = await client.query(
        `INSERT INTO transactions (no_faktur, user_id, total_item, total_harga, metode_pembayaran, status, catatan)
         VALUES ('TMP', $1, $2, $3, 'QRIS', 'menunggu_pembayaran', $4) RETURNING id`,
        [user.id, totalItem, totalHarga, catatan],
      )
      const trxId = trxRows[0].id

      const tanggal = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const noFaktur = `INV-${tanggal}-${String(trxId).padStart(4, "0")}`
      await client.query("UPDATE transactions SET no_faktur = $1 WHERE id = $2", [noFaktur, trxId])

      for (const d of detail) {
        await client.query(
          `INSERT INTO transaction_items (transaction_id, barang_id, nama_barang, harga_satuan, jumlah, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [trxId, d.barang_id, d.nama, d.harga, d.jumlah, d.subtotal],
        )
      }

      // Satu transaksi punya satu data pembayaran (QRIS)
      await client.query(
        `INSERT INTO payments (transaction_id, metode, jumlah, status)
         VALUES ($1, 'QRIS', $2, 'menunggu_pembayaran')`,
        [trxId, totalHarga],
      )

      return { trxId, noFaktur, totalHarga }
    })

    return NextResponse.json(
      {
        message: `Pesanan ${result.noFaktur} berhasil dibuat. Silakan lakukan pembayaran QRIS.`,
        transaction_id: result.trxId,
        no_faktur: result.noFaktur,
        total_harga: result.totalHarga,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("Checkout error:", err)
    const message = err instanceof Error ? err.message : "Gagal membuat pesanan"
    return NextResponse.json({ message }, { status: 400 })
  }
}
