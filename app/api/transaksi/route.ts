// API Transaksi — pengganti transaksi/read.php & transaksi/create.php
// GET  /api/transaksi?start_date=&end_date=  → daftar transaksi + item (admin)
// POST /api/transaksi                        → transaksi kasir tunai (admin);
//      pembayaran tunai langsung 'lunas' dan stok langsung berkurang.
import { NextResponse } from "next/server"
import { query, withTransaction } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const status = searchParams.get("status")

    const conditions: string[] = []
    const params: unknown[] = []
    if (startDate) {
      params.push(startDate)
      conditions.push(`t.tanggal >= $${params.length}::date`)
    }
    if (endDate) {
      params.push(endDate)
      conditions.push(`t.tanggal < ($${params.length}::date + INTERVAL '1 day')`)
    }
    if (status) {
      params.push(status)
      conditions.push(`t.status = $${params.length}`)
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const records = await query(
      `SELECT t.id, t.no_faktur, t.tanggal, t.total_item,
              t.total_harga::float8 AS total_harga, t.metode_pembayaran, t.status,
              COALESCE(u.nama_lengkap, 'Pelanggan Toko') AS nama_pembeli,
              COALESCE(
                (SELECT json_agg(json_build_object(
                   'nama_barang', ti.nama_barang,
                   'jumlah', ti.jumlah,
                   'harga_satuan', ti.harga_satuan::float8,
                   'subtotal', ti.subtotal::float8))
                 FROM transaction_items ti WHERE ti.transaction_id = t.id),
                '[]'::json
              ) AS items
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       ${where}
       ORDER BY t.tanggal DESC`,
      params,
    )

    return NextResponse.json({ records })
  } catch (err) {
    console.error("Transaksi GET error:", err)
    return NextResponse.json({ message: "Gagal memuat data transaksi" }, { status: 500 })
  }
}

interface KasirItem {
  id: number
  quantity: number
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const body = await request.json()
    const items: KasirItem[] = Array.isArray(body.items) ? body.items : []

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

      // Validasi stok + kunci baris barang, harga diambil dari database (bukan dari client)
      for (const item of items) {
        const { rows } = await client.query(
          "SELECT id, nama_barang, harga::float8 AS harga, stok FROM barang WHERE id = $1 FOR UPDATE",
          [Number(item.id)],
        )
        const barang = rows[0]
        if (!barang) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan`)
        if (barang.stok < item.quantity) {
          throw new Error(`Stok "${barang.nama_barang}" tidak mencukupi (tersisa ${barang.stok})`)
        }
        const subtotal = barang.harga * item.quantity
        totalHarga += subtotal
        totalItem += item.quantity
        detail.push({ barang_id: barang.id, nama: barang.nama_barang, harga: barang.harga, jumlah: item.quantity, subtotal })
      }

      // Simpan transaksi kasir: tunai langsung lunas
      const { rows: trxRows } = await client.query(
        `INSERT INTO transactions (no_faktur, kasir_id, total_item, total_harga, metode_pembayaran, status)
         VALUES ('TMP', $1, $2, $3, 'Tunai', 'lunas') RETURNING id`,
        [admin.id, totalItem, totalHarga],
      )
      const trxId = trxRows[0].id

      // Nomor faktur: INV-YYYYMMDD-<id>
      const tanggal = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const noFaktur = `INV-${tanggal}-${String(trxId).padStart(4, "0")}`
      await client.query("UPDATE transactions SET no_faktur = $1 WHERE id = $2", [noFaktur, trxId])

      for (const d of detail) {
        await client.query(
          `INSERT INTO transaction_items (transaction_id, barang_id, nama_barang, harga_satuan, jumlah, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [trxId, d.barang_id, d.nama, d.harga, d.jumlah, d.subtotal],
        )
        await client.query("UPDATE barang SET stok = stok - $1, updated_at = NOW() WHERE id = $2", [d.jumlah, d.barang_id])
      }

      // Catat pembayaran tunai (satu transaksi punya satu pembayaran)
      await client.query(
        `INSERT INTO payments (transaction_id, metode, jumlah, status, verified_by, verified_at)
         VALUES ($1, 'Tunai', $2, 'lunas', $3, NOW())`,
        [trxId, totalHarga, admin.id],
      )

      return { noFaktur }
    })

    return NextResponse.json({ message: `Transaksi ${result.noFaktur} berhasil disimpan!` }, { status: 201 })
  } catch (err) {
    console.error("Transaksi POST error:", err)
    const message = err instanceof Error ? err.message : "Gagal menyimpan transaksi"
    return NextResponse.json({ message }, { status: 400 })
  }
}
