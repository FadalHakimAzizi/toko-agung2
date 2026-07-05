// Koneksi PostgreSQL (Supabase / lokal) memakai node-postgres (pg).
// Connection string diambil dari environment variable DATABASE_URL.
import { Pool, type PoolClient } from "pg"

// Pool disimpan di globalThis agar tidak membuat koneksi baru
// setiap kali Next.js melakukan hot-reload saat development.
const globalForDb = globalThis as unknown as { pgPool?: Pool }

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi connection string PostgreSQL (Supabase).",
    )
  }

  // Supabase mewajibkan koneksi SSL (host bisa *.supabase.co atau *.pooler.supabase.com)
  const needSsl =
    process.env.DATABASE_SSL === "true" || connectionString.includes("supabase.co")
    || connectionString.includes("supabase.com")

  return new Pool({
    connectionString,
    ssl: needSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  })
}

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = createPool()
  }
  return globalForDb.pgPool
}

// Helper query sederhana agar route handler tetap ringkas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await getPool().query(text, params)
  return result.rows as T[]
}

// Menjalankan beberapa query dalam satu transaksi database (BEGIN/COMMIT/ROLLBACK).
// Dipakai untuk operasi yang harus atomik, misalnya checkout dan verifikasi pembayaran.
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
