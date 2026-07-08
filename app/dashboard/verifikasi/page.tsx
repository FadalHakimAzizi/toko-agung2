"use client"

// Halaman admin: verifikasi pembayaran QRIS.
// Admin melihat daftar transaksi menunggu verifikasi, membuka detail beserta
// bukti pembayaran, lalu menyetujui (stok berkurang, status 'lunas') atau
// menolak (status 'ditolak' + alasan).
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Eye, Inbox } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { PaginationMeta } from "@/lib/pagination"

interface VerifikasiItem {
  id: number
  no_faktur: string
  tanggal: string
  total_item: number
  total_harga: number
  status: string
  status_pembayaran: string
  alasan_penolakan: string | null
  nama_pembeli: string
  jumlah_bukti: number
}

interface DetailPesanan {
  id: number
  no_faktur: string
  tanggal: string
  total_harga: number
  status_pembayaran: string
  nama_pembeli: string
  catatan: string | null
  items: { nama_barang: string; jumlah: number; harga_satuan: number; subtotal: number }[] | null
  bukti: { file_path: string; uploaded_at: string }[] | null
}

const statusInfo: Record<string, { label: string; className: string }> = {
  menunggu_pembayaran: { label: "Menunggu Pembayaran", className: "bg-yellow-100 text-yellow-800" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", className: "bg-blue-100 text-blue-800" },
  lunas: { label: "Lunas", className: "bg-green-100 text-green-800" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-800" },
  dibatalkan: { label: "Dibatalkan", className: "bg-gray-100 text-gray-700" },
}

export default function VerifikasiPage() {
  const [records, setRecords] = useState<VerifikasiItem[]>([])
  const [filterStatus, setFilterStatus] = useState("menunggu_verifikasi")
  const [detail, setDetail] = useState<DetailPesanan | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const PAGE_SIZE = 20

  const fetchRecords = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        const response = await fetch(`/api/verifikasi?status=${filterStatus}&page=${targetPage}&limit=${PAGE_SIZE}`)
        const data = await response.json()
        setRecords(data.records || [])
        setPagination(data.pagination ?? null)
      } catch {
        setRecords([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    },
    [filterStatus],
  )

  // Filter status berubah → kembali ke halaman 1
  useEffect(() => {
    setPage(1)
    fetchRecords(1)
  }, [fetchRecords])

  const goToPage = (targetPage: number) => {
    setPage(targetPage)
    fetchRecords(targetPage)
  }

  const openDetail = async (id: number) => {
    setAlasan("")
    setMessage(null)
    try {
      const response = await fetch(`/api/pesanan/${id}`)
      const data = await response.json()
      if (response.ok) {
        setDetail(data.record)
        setIsDetailOpen(true)
      }
    } catch {
      setMessage({ type: "error", text: "Gagal memuat detail pesanan" })
    }
  }

  const handleVerifikasi = async (action: "setujui" | "tolak") => {
    if (!detail) return
    if (action === "tolak" && !alasan.trim()) {
      setMessage({ type: "error", text: "Alasan penolakan wajib diisi" })
      return
    }
    setProcessing(true)
    try {
      const response = await fetch(`/api/verifikasi/${detail.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, alasan }),
      })
      const data = await response.json()
      setMessage({ type: response.ok ? "success" : "error", text: data.message })
      if (response.ok) {
        setIsDetailOpen(false)
        // Kalau ini satu-satunya baris di halaman ini (dan bukan halaman
        // pertama), mundur satu halaman biar tidak menampilkan halaman kosong.
        const nextPage = records.length === 1 && page > 1 ? page - 1 : page
        setPage(nextPage)
        fetchRecords(nextPage)
      }
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Verifikasi Pembayaran</h1>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="menunggu_verifikasi">Menunggu Verifikasi</TabsTrigger>
          <TabsTrigger value="menunggu_pembayaran">Belum Dibayar</TabsTrigger>
          <TabsTrigger value="lunas">Lunas</TabsTrigger>
          <TabsTrigger value="ditolak">Ditolak</TabsTrigger>
          <TabsTrigger value="semua">Semua</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Faktur</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pembeli</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bukti</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Inbox size={16} /> Tidak ada transaksi pada status ini
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((item) => {
                const status = statusInfo[item.status_pembayaran] ?? statusInfo.menunggu_pembayaran
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.no_faktur}</TableCell>
                    <TableCell>
                      {format(new Date(item.tanggal), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </TableCell>
                    <TableCell>{item.nama_pembeli}</TableCell>
                    <TableCell className="text-right">
                      Rp {item.total_harga.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{item.jumlah_bukti > 0 ? `${item.jumlah_bukti} file` : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openDetail(item.id)}>
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

      {/* Dialog detail transaksi + aksi verifikasi */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi {detail?.no_faktur}</DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500">Pembeli</p>
                  <p className="font-medium">{detail.nama_pembeli}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(detail.tanggal), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                  </p>
                </div>
              </div>

              {detail.catatan && (
                <div>
                  <p className="text-gray-500">Catatan Pembeli</p>
                  <p>{detail.catatan}</p>
                </div>
              )}

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detail.items || []).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.nama_barang}</TableCell>
                        <TableCell className="text-center">{item.jumlah}</TableCell>
                        <TableCell className="text-right">
                          Rp {item.harga_satuan.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between font-bold">
                <span>Total Pembayaran</span>
                <span className="text-[#00C559]">Rp {detail.total_harga.toLocaleString("id-ID")}</span>
              </div>

              <div>
                <p className="text-gray-500 mb-2">Bukti Pembayaran</p>
                {(detail.bukti?.length ?? 0) === 0 ? (
                  <p className="text-gray-400">Belum ada bukti yang diunggah</p>
                ) : (
                  <div className="space-y-3">
                    {(detail.bukti || []).map((b, i) => (
                      <a key={i} href={b.file_path} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.file_path}
                          alt={`Bukti ${i + 1}`}
                          className="max-h-72 rounded-md border hover:opacity-90"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {detail.status_pembayaran === "menunggu_verifikasi" && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="alasan">Alasan penolakan (wajib diisi jika menolak)</Label>
                    <Textarea
                      id="alasan"
                      placeholder="Contoh: nominal transfer tidak sesuai total pesanan"
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                    />
                  </div>
                  {message && message.type === "error" && (
                    <Alert variant="destructive">
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 bg-[#00C559] hover:bg-[#00A047]"
                      disabled={processing}
                      onClick={() => handleVerifikasi("setujui")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {processing ? "Memproses..." : "Setujui (Lunas)"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      disabled={processing}
                      onClick={() => handleVerifikasi("tolak")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
