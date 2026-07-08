// POST /api/auth/change-password — ganti password akun sendiri (butuh login).
// Body: { current_password, new_password }
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const { current_password, new_password } = await request.json()
    if (!current_password || !new_password) {
      return NextResponse.json({ message: "Password saat ini dan password baru wajib diisi" }, { status: 400 })
    }
    if (String(new_password).length < 6) {
      return NextResponse.json({ message: "Password baru minimal 6 karakter" }, { status: 400 })
    }

    const rows = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id])
    const stored = rows[0]
    if (!stored || !verifyPassword(String(current_password), stored.password_hash)) {
      return NextResponse.json({ message: "Password saat ini salah" }, { status: 401 })
    }

    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(String(new_password)), user.id])

    return NextResponse.json({ message: "Password berhasil diganti" })
  } catch (err) {
    console.error("Change password error:", err)
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 })
  }
}
