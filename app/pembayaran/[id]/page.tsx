"use client"

// Halaman pembayaran QRIS: menampilkan total pembayaran, gambar QRIS toko
// (dari pengaturan admin), instruksi singkat, dan form unggah bukti pembayaran.
// Setelah bukti diunggah, status berubah menjadi 'menunggu_verifikasi'.
import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, CheckCircle2, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface ItemPesanan {
  nama_barang: string
  jumlah: number
  harga_satuan: number
  subtotal: number
}

interface Pesanan {
  id: number
  no_faktur: string
  tanggal: string
  total_harga: number
  status: string
  status_pembayaran: string
  alasan_penolakan: string | null
  items: ItemPesanan[] | null
  bukti: { file_path: string; uploaded_at: string }[] | null
}

// Label & warna status dalam bahasa Indonesia
const statusInfo: Record<string, { label: string; className: string }> = {
  menunggu_pembayaran: { label: "Menunggu Pembayaran", className: "bg-yellow-100 text-yellow-800" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", className: "bg-blue-100 text-blue-800" },
  lunas: { label: "Lunas", className: "bg-green-100 text-green-800" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-800" },
  dibatalkan: { label: "Dibatalkan", className: "bg-gray-100 text-gray-700" },
}

export default function PembayaranPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [pesanan, setPesanan] = useState<Pesanan | null>(null)
  const [qrisImage, setQrisImage] = useState("/qris-placeholder.svg")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchPesanan = useCallback(async () => {
    try {
      const response = await fetch(`/api/pesanan/${params.id}`)
      if (response.status === 401) {
        router.push("/login")
        return
      }
      const data = await response.json()
      if (response.ok) {
        setPesanan(data.record)
      } else {
        setMessage({ type: "error", text: data.message || "Pesanan tidak ditemukan" })
      }
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchPesanan()
    // Ambil gambar QRIS toko dari pengaturan
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.qris_image) setQrisImage(data.settings.qris_image)
      })
      .catch(() => {})
  }, [fetchPesanan])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setMessage(null)
    setFile(selected)
    setPreview(selected ? URL.createObjectURL(selected) : null)
  }

  const handleUpload = async () => {
    if (!file || !pesanan) return
    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch(`/api/pesanan/${pesanan.id}/bukti`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setFile(null)
        setPreview(null)
        fetchPesanan()
      } else {
        setMessage({ type: "error", text: data.message || "Gagal mengunggah bukti" })
      }
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setUploading(false)
    }
  }

  const status = pesanan ? statusInfo[pesanan.status_pembayaran] : null
  const bisaUpload =
    pesanan && ["menunggu_pembayaran", "menunggu_verifikasi", "ditolak"].includes(pesanan.status_pembayaran)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/pesanan" className="text-[#2D2D2D] hover:text-[#00C559]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold text-[#2D2D2D]">Pembayaran QRIS</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Memuat data pembayaran...</div>
        ) : !pesanan ? (
          <div className="text-center py-20 text-gray-500">Pesanan tidak ditemukan</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Kolom kiri: detail pesanan */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle>Detail Pesanan</CardTitle>
                  {status && <Badge className={status.className}>{status.label}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Faktur</span>
                  <span className="font-medium">{pesanan.no_faktur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal</span>
                  <span>{format(new Date(pesanan.tanggal), "dd MMMM yyyy, HH:mm", { locale: localeId })}</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  {(pesanan.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.nama_barang} × {item.jumlah}
                      </span>
                      <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-3">
                  <span>Total Pembayaran</span>
                  <span className="text-[#00C559]">Rp {pesanan.total_harga.toLocaleString("id-ID")}</span>
                </div>

                {pesanan.status_pembayaran === "ditolak" && pesanan.alasan_penolakan && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pembayaran ditolak: {pesanan.alasan_penolakan}. Silakan unggah ulang bukti yang benar.
                    </AlertDescription>
                  </Alert>
                )}
                {pesanan.status_pembayaran === "menunggu_verifikasi" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Bukti pembayaran sudah diterima dan sedang menunggu verifikasi admin.
                    </AlertDescription>
                  </Alert>
                )}
                {pesanan.status_pembayaran === "lunas" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Pembayaran telah diverifikasi. Terima kasih telah berbelanja!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Kolom kanan: QRIS + upload bukti */}
            <div className="space-y-6">
              {pesanan.status_pembayaran !== "lunas" && pesanan.status_pembayaran !== "dibatalkan" && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Scan QRIS untuk Membayar</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrisImage}
                      alt="Kode QRIS Toko Agung"
                      className="w-full max-w-[280px] border rounded-lg"
                    />
                    <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1 self-start">
                      <li>Buka aplikasi pembayaran (GoPay, OVO, DANA, mobile banking, dll.)</li>
                      <li>Pilih menu bayar / scan QRIS, lalu scan kode di atas</li>
                      <li>
                        Masukkan nominal <b>Rp {pesanan.total_harga.toLocaleString("id-ID")}</b> lalu konfirmasi
                      </li>
                      <li>Simpan tangkapan layar bukti pembayaran</li>
                      <li>Unggah bukti pembayaran pada form di bawah</li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {bisaUpload && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>
                      {pesanan.status_pembayaran === "menunggu_verifikasi"
                        ? "Ganti Bukti Pembayaran"
                        : "Unggah Bukti Pembayaran"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bukti">File gambar (JPG, JPEG, PNG, WEBP — maks. 2MB)</Label>
                      <Input
                        id="bukti"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                      />
                    </div>
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Preview bukti" className="max-h-56 rounded-md border" />
                    )}
                    <Button
                      className="w-full bg-[#00C559] hover:bg-[#00A047]"
                      disabled={!file || uploading}
                      onClick={handleUpload}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Mengunggah..." : "Unggah Bukti Pembayaran"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(pesanan.bukti?.length ?? 0) > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Bukti Terunggah</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(pesanan.bukti || []).map((b, i) => (
                      <div key={i} className="text-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.file_path} alt={`Bukti ${i + 1}`} className="max-h-56 rounded-md border" />
                        <p className="text-gray-500 mt-1">
                          Diunggah {format(new Date(b.uploaded_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
