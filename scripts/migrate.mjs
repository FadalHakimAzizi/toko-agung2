// Migration runner sederhana: menjalankan file SQL di db/migrations
// secara berurutan dan mencatat yang sudah dijalankan di tabel schema_migrations.
// Jalankan dengan: npm run db:migrate
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import pg from "pg"

try {
  process.loadEnvFile(".env")
} catch {
  // .env belum ada; DATABASE_URL mungkin sudah diatur lewat environment
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("❌ DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi connection string Supabase/PostgreSQL.")
  process.exit(1)
}

const needSsl = process.env.DATABASE_SSL === "true" || connectionString.includes("supabase.co") || connectionString.includes("supabase.com")
const client = new pg.Client({ connectionString, ssl: needSsl ? { rejectUnauthorized: false } : undefined })

async function main() {
  await client.connect()
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)

  const dir = path.join(process.cwd(), "db", "migrations")
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()

  const { rows } = await client.query("SELECT filename FROM schema_migrations")
  const applied = new Set(rows.map((r) => r.filename))

  let count = 0
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = await readFile(path.join(dir, file), "utf8")
    console.log(`▶ Menjalankan migration: ${file}`)
    try {
      await client.query("BEGIN")
      await client.query(sql)
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file])
      await client.query("COMMIT")
      count++
    } catch (err) {
      await client.query("ROLLBACK")
      console.error(`❌ Gagal pada ${file}:`, err.message)
      process.exit(1)
    }
  }

  console.log(count > 0 ? `✅ ${count} migration berhasil dijalankan.` : "✅ Database sudah paling baru, tidak ada migration baru.")
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message)
    process.exitCode = 1
  })
  .finally(() => client.end())
