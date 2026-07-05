// POST /api/auth/logout — menghapus sesi dan cookie
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, SESSION_COOKIE } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ message: "Logout berhasil" })
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
    return response
  } catch (err) {
    console.error("Logout error:", err)
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 })
  }
}
