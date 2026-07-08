// GET /api/chatbot/logs — riwayat percakapan chatbot RAG (admin).
// ?q=kata (cari di pertanyaan) &page=&limit=
// Dipakai dashboard "Riwayat Chatbot" untuk menunjukkan bukti retrieval RAG
// bekerja: tiap baris punya `sumber` (data apa yang dipakai menjawab).
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { parsePagination, buildPaginationMeta, splitCountedRows } from "@/lib/pagination"

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()
    const { page, limit, offset } = parsePagination(searchParams)

    const where = q ? "WHERE cl.pertanyaan ILIKE $1" : ""
    const params: unknown[] = q ? [`%${q}%`] : []

    const rows = await query(
      `SELECT cl.id, cl.pertanyaan, cl.jawaban, cl.sumber, cl.created_at,
              COALESCE(u.nama_lengkap, 'Pengunjung') AS nama_penanya,
              COUNT(*) OVER() AS total_count
       FROM chatbot_logs cl
       LEFT JOIN users u ON u.id = cl.user_id
       ${where}
       ORDER BY cl.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )
    const { records, total } = splitCountedRows(rows)

    // Ringkasan atas SELURUH data yang cocok filter (bukan cuma halaman ini):
    // berapa persen jawaban benar-benar "digroundkan" ke data toko (sumber
    // terisi) vs tidak (sapaan atau ditolak karena di luar topik).
    const [summaryRow] = await query<{ total: number; grounded: number }>(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE sumber IS NOT NULL)::int AS grounded
       FROM chatbot_logs cl
       ${where}`,
      params,
    )
    const groundedPercentage =
      summaryRow.total > 0 ? Math.round((summaryRow.grounded / summaryRow.total) * 100) : 0

    return NextResponse.json({
      records,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        total: summaryRow.total,
        grounded: summaryRow.grounded,
        grounded_percentage: groundedPercentage,
      },
    })
  } catch (err) {
    console.error("Chatbot logs GET error:", err)
    return NextResponse.json({ message: "Gagal memuat riwayat chatbot" }, { status: 500 })
  }
}
