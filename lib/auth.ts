// Autentikasi & sesi: hash password memakai crypto.scrypt bawaan Node
// (tanpa dependency tambahan) dan sesi berbasis token di tabel sessions.
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

export const SESSION_COOKIE = "session_token"
const SESSION_DAYS = 7

// Proteksi brute-force login: kunci akun sementara setelah beberapa kali gagal.
export const LOGIN_MAX_ATTEMPTS = 5
export const LOGIN_LOCK_MINUTES = 15

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

// Hash "umpan" dipakai saat username tidak ditemukan, supaya login tetap
// menjalankan scrypt dan waktu respons tidak beda dengan kasus password
// salah (mencegah enumerasi username lewat timing attack).
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"))
export function verifyAgainstDummyHash(password: string): void {
  verifyPassword(password, DUMMY_HASH)
}

// Akun terkunci jika locked_until masih di masa depan
export function isAccountLocked(lockedUntil: Date | string | null): boolean {
  return !!lockedUntil && new Date(lockedUntil) > new Date()
}

// Catat percobaan login gagal; kunci akun sementara jika melewati batas
export async function registerFailedLogin(userId: number): Promise<void> {
  const rows = await query<{ failed_attempts: number }>(
    "UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = $1 RETURNING failed_attempts",
    [userId],
  )
  if ((rows[0]?.failed_attempts ?? 0) >= LOGIN_MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
    await query("UPDATE users SET locked_until = $1 WHERE id = $2", [lockedUntil, userId])
  }
}

// Reset penghitung setelah login berhasil
export async function resetFailedLogin(userId: number): Promise<void> {
  await query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1", [userId])
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
  // Bersihkan sesi kedaluwarsa sesekali (probabilistik) agar tabel sessions
  // tidak menumpuk tanpa perlu cron job terpisah.
  if (Math.random() < 0.05) {
    query("DELETE FROM sessions WHERE expires_at < NOW()").catch(() => {})
  }
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
