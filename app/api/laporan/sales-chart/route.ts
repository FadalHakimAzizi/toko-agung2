// GET /api/laporan/sales-chart?range=weekly|monthly
// Data grafik penjualan (pengganti laporan/sales_chart.php).
// Mengembalikan format ChartData milik chart.js sesuai yang dipakai frontend lama.
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") === "monthly" ? "monthly" : "weekly"

    // generate_series memastikan hari/bulan tanpa penjualan tetap muncul bernilai 0
    const rows =
      range === "weekly"
        ? await query(`
            SELECT to_char(d.tanggal, 'DD Mon') AS label,
                   COALESCE(SUM(t.total_harga), 0)::float8 AS total
            FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day') AS d(tanggal)
            LEFT JOIN transactions t
              ON t.tanggal::date = d.tanggal AND t.status = 'lunas'
            GROUP BY d.tanggal ORDER BY d.tanggal
          `)
        : await query(`
            SELECT to_char(d.bulan, 'Mon YY') AS label,
                   COALESCE(SUM(t.total_harga), 0)::float8 AS total
            FROM generate_series(
              date_trunc('month', NOW()) - INTERVAL '11 months',
              date_trunc('month', NOW()), '1 month') AS d(bulan)
            LEFT JOIN transactions t
              ON date_trunc('month', t.tanggal) = d.bulan AND t.status = 'lunas'
            GROUP BY d.bulan ORDER BY d.bulan
          `)

    return NextResponse.json({
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: "Pendapatan",
          data: rows.map((r) => r.total),
          fill: true,
          borderColor: "rgb(0, 197, 89)",
          backgroundColor: "rgba(0, 197, 89, 0.1)",
          tension: 0.4,
        },
      ],
    })
  } catch (err) {
    console.error("Sales chart error:", err)
    return NextResponse.json({ message: "Gagal memuat data grafik" }, { status: 500 })
  }
}
