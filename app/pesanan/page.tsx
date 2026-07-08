"use client"

// Halaman "Pesanan Saya": daftar pesanan milik pembeli beserta statusnya.
// Dari sini pembeli bisa melanjutkan pembayaran atau membatalkan pesanan.
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ShoppingBag, Receipt } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { UserNav } from "@/components/user-nav"

interface Pesanan {
  id: number
  no_faktur: string
  tanggal: string
  total_item: number
  total_harga: number
  status: string
  status_pembayaran: string | null
  alasan_penolakan: string | null
}

const statusInfo: Record<string, { label: string; className: string }> = {
  menunggu_pembayaran: { label: "Menunggu Pembayaran", className: "bg-yellow-100 text-yellow-800" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", className: "bg-blue-100 text-blue-800" },
  lunas: { label: "Lunas", className: "bg-green-100 text-green-800" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-800" },
  dibatalkan: { label: "Dibatalkan", className: "bg-gray-100 text-gray-700" },
}

export default function PesananPage() {
  const router = useRouter()
  const [pesananList, setPesananList] = useState<Pesanan[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPesanan = useCallback(async () => {
    try {
      const response = await fetch("/api/pesanan")
      if (response.status === 401) {
        router.push("/login")
        return
      }
      const data = await response.json()
      setPesananList(data.records || [])
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchPesanan()
  }, [fetchPesanan])

  const handleBatalkan = async (id: number) => {
    if (!confirm("Yakin ingin membatalkan pesanan ini?")) return
    try {
      const response = await fetch(`/api/pesanan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batalkan" }),
      })
      const data = await response.json()
      setMessage({ type: response.ok ? "success" : "error", text: data.message })
      if (response.ok) fetchPesanan()
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/belanja" className="text-[#2D2D2D] hover:text-[#00C559]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-bold text-[#2D2D2D]">Pesanan Saya</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/belanja">
              <Button size="sm" variant="outline">
                <ShoppingBag className="h-4 w-4 mr-1" /> Belanja Lagi
              </Button>
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Memuat pesanan...</div>
        ) : pesananList.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-16 text-center text-gray-500">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className="mb-4">Anda belum memiliki pesanan</p>
              <Link href="/belanja">
                <Button className="bg-[#00C559] hover:bg-[#00A047]">Mulai Belanja</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pesananList.map((pesanan) => {
              const status = statusInfo[pesanan.status] ?? statusInfo.menunggu_pembayaran
              return (
                <Card key={pesanan.id} className="border-none shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#2D2D2D]">{pesanan.no_faktur}</p>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(pesanan.tanggal), "dd MMMM yyyy, HH:mm", { locale: localeId })} ·{" "}
                          {pesanan.total_item} item
                        </p>
                        {pesanan.status === "ditolak" && pesanan.alasan_penolakan && (
                          <p className="text-sm text-red-600 mt-1">Alasan: {pesanan.alasan_penolakan}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <p className="font-bold text-[#00C559]">
                          Rp {pesanan.total_harga.toLocaleString("id-ID")}
                        </p>
                        <div className="flex gap-2">
                          {pesanan.status === "menunggu_pembayaran" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleBatalkan(pesanan.id)}
                            >
                              Batalkan
                            </Button>
                          )}
                          <Link href={`/pembayaran/${pesanan.id}`}>
                            <Button size="sm" className="bg-[#00C559] hover:bg-[#00A047]">
                              {pesanan.status === "menunggu_pembayaran" ? "Bayar" : "Detail"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
      <ChatbotWidget />
    </div>
  )
}
