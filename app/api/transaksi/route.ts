// API Transaksi — pengganti transaksi/read.php & transaksi/create.php
// GET  /api/transaksi?start_date=&end_date=&page=&limit=  → daftar transaksi + item (admin)
//      `page`/`limit` opsional — tanpa itu, kembalikan seluruh data yang cocok
//      filter (perilaku lama). Dengan itu, respons dipaginasi + `pagination` dan
//      `summary` (total transaksi & total penjualan atas SELURUH data yang cocok
//      filter, bukan cuma halaman saat ini — supaya kartu ringkasan tetap akurat).
// POST /api/transaksi                        → transaksi kasir tunai (admin);
//      pembayaran tunai langsung 'lunas' dan stok langsung berkurang.
import { NextResponse } from "next/server"
import { query, withTransaction } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { parsePagination, buildPaginationMeta } from "@/lib/pagination"

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const status = searchParams.get("status")
    const isPaginated = searchParams.has("page") || searchParams.has("limit")

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

    const baseFields = `t.id, t.no_faktur, t.tanggal, t.total_item,
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
              ) AS items`
    const fromClause = `FROM transactions t LEFT JOIN users u ON u.id = t.user_id`

    if (!isPaginated) {
      const records = await query(
        `SELECT ${baseFields} ${fromClause} ${where} ORDER BY t.tanggal DESC`,
        params,
      )
      return NextResponse.json({ records })
    }

    const { page, limit, offset } = parsePagination(searchParams)
    const rows = await query(
      `SELECT ${baseFields},
              COUNT(*) OVER() AS total_count,
              COALESCE(SUM(t.total_harga) OVER(), 0)::float8 AS total_sum
       ${fromClause} ${where}
       ORDER BY t.tanggal DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0
    const totalPenjualan = rows.length > 0 ? Number(rows[0].total_sum) : 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const records = rows.map(({ total_count, total_sum, ...rest }) => rest)

    return NextResponse.json({
      records,
      pagination: buildPaginationMeta(page, limit, total),
      summary: { total_transaksi: total, total_penjualan: totalPenjualan },
    })
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
