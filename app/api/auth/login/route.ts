// POST /api/auth/login — login admin/user, membuat sesi + cookie httpOnly
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import {
  createSession,
  verifyPassword,
  verifyAgainstDummyHash,
  isAccountLocked,
  registerFailedLogin,
  resetFailedLogin,
  LOGIN_LOCK_MINUTES,
  SESSION_COOKIE,
} from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Username dan password wajib diisi" }, { status: 400 })
    }

    const rows = await query(
      "SELECT id, username, password_hash, nama_lengkap, role, locked_until FROM users WHERE username = $1",
      [String(username).trim().toLowerCase()],
    )
    const user = rows[0]

    if (!user) {
      // Tetap jalankan scrypt terhadap hash umpan agar waktu respons mirip
      // dengan kasus password salah (mencegah enumerasi username).
      verifyAgainstDummyHash(String(password))
      return NextResponse.json({ message: "Username atau password salah!" }, { status: 401 })
    }

    if (isAccountLocked(user.locked_until)) {
      return NextResponse.json(
        { message: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${LOGIN_LOCK_MINUTES} menit.` },
        { status: 429 },
      )
    }

    if (!verifyPassword(String(password), user.password_hash)) {
      await registerFailedLogin(user.id)
      return NextResponse.json({ message: "Username atau password salah!" }, { status: 401 })
    }

    await resetFailedLogin(user.id)

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
