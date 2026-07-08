// Rate limiter in-memory sederhana (sliding-window kasar per instance).
// Cukup untuk mencegah penyalahgunaan (mis. spam chatbot yang memakan
// kuota API LLM/embedding) pada deployment skala kecil. Pada serverless
// multi-instance ini best-effort saja karena memori tidak dibagi antar
// instance — bukan pengganti rate limiting terpusat (mis. Redis) untuk
// skala besar.
const buckets = new Map<string, { count: number; resetAt: number }>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  bucket.count += 1
  return bucket.count > limit
}

// Ambil alamat IP client dari header proxy (Vercel/umumnya di belakang proxy)
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}
