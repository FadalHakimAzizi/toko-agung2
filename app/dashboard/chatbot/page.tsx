"use client"

// Halaman admin: riwayat percakapan chatbot RAG. Menunjukkan bukti konkret
// retrieval bekerja — tiap jawaban disertai `sumber` (data toko apa yang
// dipakai), bukan cuma teks jawaban seperti chatbot generik.
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { PaginationMeta } from "@/lib/pagination"
import { formatSumberLabels } from "@/lib/sumber-labels"
import { Eye, MessageSquare, Search, Database, Inbox } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface LogItem {
  id: number
  pertanyaan: string
  jawaban: string
  sumber: string | null
  created_at: string
  nama_penanya: string
}

interface Summary {
  total: number
  grounded: number
  grounded_percentage: number
}

const PAGE_SIZE = 20

export default function ChatbotLogsPage() {
  const [records, setRecords] = useState<LogItem[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, grounded: 0, grounded_percentage: 0 })
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<LogItem | null>(null)

  const fetchLogs = async (targetPage: number, q: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) })
      if (q) params.set("q", q)
      const response = await fetch(`/api/chatbot/logs?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setRecords(data.records || [])
        setPagination(data.pagination ?? null)
        setSummary(data.summary ?? { total: 0, grounded: 0, grounded_percentage: 0 })
      }
    } catch {
      setRecords([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  // Debounce pencarian, kembali ke halaman 1 tiap kali kata kunci berubah
  useEffect(() => {
    const delayed = setTimeout(() => fetchLogs(1, searchTerm), 400)
    return () => clearTimeout(delayed)
  }, [searchTerm])

  const goToPage = (targetPage: number) => fetchLogs(targetPage, searchTerm)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Riwayat Chatbot</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Percakapan</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Dijawab dari Data Toko</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C559]">{summary.grounded_percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.grounded} dari {summary.total} percakapan</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sapaan / Di Luar Topik</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total - summary.grounded}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari pertanyaan..."
          className="pl-8 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Penanya</TableHead>
              <TableHead>Pertanyaan</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Memuat data...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Inbox size={16} /> Belum ada riwayat percakapan
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((log) => {
                const sources = formatSumberLabels(log.sumber)
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-sm">{log.nama_penanya}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{log.pertanyaan}</TableCell>
                    <TableCell>
                      {sources.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sources.map((label, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-normal">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setDetail(log)}>
                        <Eye className="h-4 w-4 mr-1" /> Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && <PaginationBar pagination={pagination} onPageChange={goToPage} disabled={loading} />}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Percakapan</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{detail.nama_penanya}</span>
                <span>{format(new Date(detail.created_at), "dd MMMM yyyy, HH:mm", { locale: localeId })}</span>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Pertanyaan</p>
                <p className="rounded-md bg-gray-50 border px-3 py-2">{detail.pertanyaan}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Jawaban</p>
                <p className="rounded-md bg-gray-50 border px-3 py-2 whitespace-pre-wrap">{detail.jawaban}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-2">Sumber data yang dipakai</p>
                {formatSumberLabels(detail.sumber).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {formatSumberLabels(detail.sumber).map((label, i) => (
                      <Badge key={i} variant="outline" className="font-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Tidak ada (sapaan atau di luar topik toko)</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
