// POST /api/auth/register — pendaftaran akun pembeli (role selalu 'user')
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password, nama_lengkap } = await request.json()

    const cleanUsername = String(username ?? "").trim().toLowerCase()
    const cleanNama = String(nama_lengkap ?? "").trim()

    if (!cleanUsername || !password || !cleanNama) {
      return NextResponse.json({ message: "Semua kolom wajib diisi" }, { status: 400 })
    }
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        { message: "Username 3-30 karakter, hanya huruf, angka, dan garis bawah" },
        { status: 400 },
      )
    }
    if (String(password).length < 6) {
      return NextResponse.json({ message: "Password minimal 6 karakter" }, { status: 400 })
    }

    const existing = await query("SELECT id FROM users WHERE username = $1", [cleanUsername])
    if (existing.length > 0) {
      return NextResponse.json({ message: "Username sudah terdaftar" }, { status: 409 })
    }

    // Role selalu 'user' — akun admin hanya dibuat lewat seeder/database
    await query(
      "INSERT INTO users (username, password_hash, nama_lengkap, role) VALUES ($1, $2, $3, 'user')",
      [cleanUsername, hashPassword(String(password)), cleanNama],
    )

    return NextResponse.json({ message: "Pendaftaran berhasil, silakan login" }, { status: 201 })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 })
  }
}
