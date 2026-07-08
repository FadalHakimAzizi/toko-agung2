// Helper pagination sederhana dipakai oleh endpoint list (barang, transaksi,
// verifikasi). Konsisten: query param `page` (mulai 1) & `limit`, dibatasi
// MAX_PAGE_SIZE supaya tidak bisa diminta sekaligus dalam jumlah besar.
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const pageRaw = Number(searchParams.get("page"))
  const limitRaw = Number(searchParams.get("limit"))
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1 ? Math.min(MAX_PAGE_SIZE, Math.floor(limitRaw)) : DEFAULT_PAGE_SIZE
  return { page, limit, offset: (page - 1) * limit }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

// Baris hasil query yang menyertakan kolom `total_count` (dari `COUNT(*) OVER()`)
// dipisah jadi data bersih + total, dalam satu query (tanpa query COUNT terpisah).
export function splitCountedRows<T extends { total_count?: number | string }>(
  rows: T[],
): { records: Omit<T, "total_count">[]; total: number } {
  const total = rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const records = rows.map(({ total_count, ...rest }) => rest)
  return { records, total }
}
