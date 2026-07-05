// POST /api/auth/login — login admin/user, membuat sesi + cookie httpOnly
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createSession, verifyPassword, SESSION_COOKIE } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Username dan password wajib diisi" }, { status: 400 })
    }

    const rows = await query(
      "SELECT id, username, password_hash, nama_lengkap, role FROM users WHERE username = $1",
      [String(username).trim().toLowerCase()],
    )
    const user = rows[0]

    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return NextResponse.json({ message: "Username atau password salah!" }, { status: 401 })
    }

    const { token, expiresAt } = await createSession(user.id)

    const response = NextResponse.json({
      message: "Login berhasil",
      user: { id: user.id, username: user.username, nama_lengkap: user.nama_lengkap, role: user.role },
    })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    })
    return response
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 })
  }
}
