// GET /api/laporan/export?jenis=transaksi|stok|pembayaran&format=pdf|excel
//     &start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Export laporan dari backend (khusus admin):
// - PDF  : jspdf + jspdf-autotable
// - Excel: exceljs
// Format laporan: judul, tanggal export, tabel data, dan ringkasan.
import { NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs"
import { requireAdmin } from "@/lib/auth"
import { buildReport, type JenisLaporan, type ReportData } from "@/lib/report"

function tanggalExport(): string {
  return new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------- Generator PDF ----------
function generatePdf(report: ReportData): Buffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  doc.setFontSize(14)
  doc.text(report.judul, 14, 15)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Tanggal export: ${tanggalExport()}`, 14, 21)
  if (report.periode) doc.text(report.periode, 14, 26)

  autoTable(doc, {
    startY: report.periode ? 30 : 26,
    head: [report.kolom],
    body: report.baris.map((row) => row.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 197, 89] }, // hijau khas Toko Agung
  })

  // Ringkasan di bawah tabel
  const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text("Ringkasan:", 14, afterTableY)
  report.ringkasan.forEach((item, i) => {
    doc.setFontSize(9)
    doc.text(`${item.label}: ${item.nilai}`, 14, afterTableY + 6 + i * 5)
  })

  return Buffer.from(doc.output("arraybuffer"))
}

// ---------- Generator Excel ----------
async function generateExcel(report: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Laporan")

  // Judul & tanggal export
  sheet.addRow([report.judul]).font = { bold: true, size: 14 }
  sheet.addRow([`Tanggal export: ${tanggalExport()}`])
  if (report.periode) sheet.addRow([report.periode])
  sheet.addRow([])

  // Header tabel
  const headerRow = sheet.addRow(report.kolom)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00C559" } }
    cell.border = { bottom: { style: "thin" } }
  })

  // Baris data
  for (const baris of report.baris) {
    sheet.addRow(baris)
  }

  // Ringkasan
  sheet.addRow([])
  sheet.addRow(["Ringkasan"]).font = { bold: true }
  for (const item of report.ringkasan) {
    sheet.addRow([item.label, item.nilai])
  }

  // Lebar kolom otomatis sederhana
  sheet.columns.forEach((col) => {
    let max = 12
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      max = Math.max(max, String(cell.value ?? "").length + 2)
    })
    col.width = Math.min(max, 45)
  })

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Akses ditolak, khusus admin" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const jenisParam = searchParams.get("jenis") ?? "transaksi"
    const format = searchParams.get("format") === "excel" ? "excel" : "pdf"
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    if (!["transaksi", "stok", "pembayaran"].includes(jenisParam)) {
      return NextResponse.json({ message: "Jenis laporan tidak dikenal" }, { status: 400 })
    }
    const jenis = jenisParam as JenisLaporan

    const report = await buildReport(jenis, startDate, endDate)
    const tanggalFile = new Date().toISOString().slice(0, 10)

    if (format === "excel") {
      const buffer = await generateExcel(report)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="laporan-${jenis}-${tanggalFile}.xlsx"`,
        },
      })
    }

    const buffer = generatePdf(report)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-${jenis}-${tanggalFile}.pdf"`,
      },
    })
  } catch (err) {
    console.error("Export laporan error:", err)
    return NextResponse.json({ message: "Gagal membuat file laporan" }, { status: 500 })
  }
}
