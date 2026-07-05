// Autentikasi & sesi: hash password memakai crypto.scrypt bawaan Node
// (tanpa dependency tambahan) dan sesi berbasis token di tabel sessions.
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

export const SESSION_COOKIE = "session_token"
const SESSION_DAYS = 7

export interface SessionUser {
  id: number
  username: string
  nama_lengkap: string
  role: "admin" | "user"
}

// Format hash yang disimpan: <salt-hex>:<hash-hex>
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, "hex")
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

// Membuat sesi baru dan mengembalikan token untuk disimpan di cookie
export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [
    token,
    userId,
    expiresAt,
  ])
  return { token, expiresAt }
}

export async function deleteSession(token: string): Promise<void> {
  await query("DELETE FROM sessions WHERE token = $1", [token])
}

// Mengambil user yang sedang login dari cookie sesi (null jika tidak login)
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await query<SessionUser>(
    `SELECT u.id, u.username, u.nama_lengkap, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token],
  )
  return rows[0] ?? null
}

// Guard role admin: dipakai route handler untuk endpoint sensitif
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  return user?.role === "admin" ? user : null
}
