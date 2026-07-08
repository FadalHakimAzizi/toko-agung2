// API Barang — pengganti endpoint PHP barang/read|create|update|delete.php
// GET    /api/barang?s=kata   → daftar barang (publik, dipakai katalog & dashboard)
// POST   /api/barang          → tambah barang (admin)
// PUT    /api/barang          → ubah barang (admin)
// DELETE /api/barang          → hapus barang (admin)
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

const BASE_SELECT = `
  SELECT b.id, b.kode_barang, b.nama_barang,
         COALESCE(k.nama_kategori, 'Tanpa Kategori') AS nama_kategori,
         b.harga::float8 AS harga, b.stok, b.stok_minimum, b.satuan,
         b.deskripsi, b.gambar, b.status
  FROM barang b
  LEFT JOIN kategori k ON k.id = b.kategori_id`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const s = searchParams.get("s")?.trim()

    const records = s
      ? await query(
          `${BASE_SELECT} WHERE b.nama_barang ILIKE $1 OR b.kode_barang ILIKE $1 ORDER BY b.nama_barang`,
          [`%${s}%`],
        )
      : await query(`${BASE_SELECT} ORDER BY b.nama_barang`)

    return NextResponse.json({ records })
  } catch (err) {
    console.error("Barang GET error:", err)
    return NextResponse.json({ message: "Gagal memuat data barang" }, { status: 500 })
  }
}

// Validasi input barang (dipakai POST dan PUT)
function validateBarang(body: Record<string, unknown>) {
  const nama = String(body.nama_barang ?? "").trim()
  const harga = Number(body.harga)
  const stok = Number(body.stok)
  const stokMinimum = Number(body.stok_minimum ?? 10)

  if (!nama) return "Nama barang wajib diisi"
  if (!body.kategori_id) return "Kategori wajib dipilih"
  if (!Number.isFinite(harga) || harga < 0) return "Harga tidak boleh kosong atau minus"
  if (!Number.isInteger(stok) || stok < 0) return "Stok tidak boleh kosong atau minus"
  if (!Number.isInteger(stokMinimum) || stokMinimum < 0) return "Stok minimum tidak valid"
  return null
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const body = await request.json()
    const errorMsg = validateBarang(body)
    if (errorMsg) return NextResponse.json({ message: errorMsg }, { status: 400 })

    // Kode barang dibuat otomatis berurutan: BRG-0001, BRG-0002, ...
    const [{ next_num }] = await query(
      `SELECT COALESCE(MAX(SUBSTRING(kode_barang FROM 5)::int), 0) + 1 AS next_num
       FROM barang WHERE kode_barang ~ '^BRG-[0-9]+$'`,
    )
    const kode = `BRG-${String(next_num).padStart(4, "0")}`

    await query(
      `INSERT INTO barang (kode_barang, nama_barang, kategori_id, harga, stok, stok_minimum, satuan, deskripsi, gambar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        kode,
        String(body.nama_barang).trim(),
        Number(body.kategori_id),
        Number(body.harga),
        Number(body.stok),
        Number(body.stok_minimum ?? 10),
        String(body.satuan ?? "pcs"),
        String(body.deskripsi ?? ""),
        typeof body.gambar === "string" && body.gambar.trim() ? body.gambar.trim() : null,
      ],
    )

    return NextResponse.json({ message: "Barang berhasil ditambahkan" }, { status: 201 })
  } catch (err) {
    console.error("Barang POST error:", err)
    return NextResponse.json({ message: "Gagal menambahkan barang" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const body = await request.json()
    if (!body.id) return NextResponse.json({ message: "ID barang wajib diisi" }, { status: 400 })
    const errorMsg = validateBarang(body)
    if (errorMsg) return NextResponse.json({ message: errorMsg }, { status: 400 })

    const result = await query(
      `UPDATE barang
       SET nama_barang = $1, kategori_id = $2, harga = $3, stok = $4,
           stok_minimum = $5, satuan = $6, deskripsi = $7,
           status = COALESCE($8, status), gambar = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING id`,
      [
        String(body.nama_barang).trim(),
        Number(body.kategori_id),
        Number(body.harga),
        Number(body.stok),
        Number(body.stok_minimum ?? 10),
        String(body.satuan ?? "pcs"),
        String(body.deskripsi ?? ""),
        body.status ?? null,
        typeof body.gambar === "string" && body.gambar.trim() ? body.gambar.trim() : null,
        Number(body.id),
      ],
    )

    if (result.length === 0) {
      return NextResponse.json({ message: "Barang tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json({ message: "Barang berhasil diupdate" })
  } catch (err) {
    console.error("Barang PUT error:", err)
    return NextResponse.json({ message: "Gagal mengupdate barang" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ message: "ID barang wajib diisi" }, { status: 400 })

    const result = await query("DELETE FROM barang WHERE id = $1 RETURNING id", [Number(id)])
    if (result.length === 0) {
      return NextResponse.json({ message: "Barang tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json({ message: "Barang berhasil dihapus" })
  } catch (err) {
    console.error("Barang DELETE error:", err)
    return NextResponse.json({ message: "Gagal menghapus barang" }, { status: 500 })
  }
}
