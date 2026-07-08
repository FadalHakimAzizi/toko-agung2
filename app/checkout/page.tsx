"use client"

// Halaman checkout: ringkasan pesanan (nama barang, jumlah, harga satuan,
// subtotal, total, tanggal) lalu membuat pesanan berstatus 'menunggu_pembayaran'.
// Stok divalidasi server-side; stok belum berkurang pada tahap ini.
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { getCart, saveCart, clearCart, cartTotal, type CartItem } from "@/lib/cart"
import { UserNav } from "@/components/user-nav"

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [catatan, setCatatan] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCart(getCart())
    setMounted(true)
  }, [])

  const updateQuantity = (id: number, newQuantity: number) => {
    const item = cart.find((i) => i.id === id)
    if (!item) return
    // Jumlah minimal 1 dan tidak boleh melebihi stok yang tercatat
    const quantity = Math.max(1, Math.min(newQuantity, item.stok))
    const newCart = cart.map((i) => (i.id === id ? { ...i, quantity } : i))
    setCart(newCart)
    saveCart(newCart)
  }

  const removeItem = (id: number) => {
    const newCart = cart.filter((i) => i.id !== id)
    setCart(newCart)
    saveCart(newCart)
  }

  const handleCheckout = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          catatan,
        }),
      })
      const data = await response.json()

      if (response.status === 401) {
        // Belum login → arahkan ke login, keranjang tetap tersimpan
        router.push("/login")
        return
      }
      if (response.ok) {
        clearCart()
        // Lanjut ke halaman pembayaran QRIS
        router.push(`/pembayaran/${data.transaction_id}`)
      } else {
        setError(data.message || "Gagal membuat pesanan")
        setLoading(false)
      }
    } catch {
      setError("Tidak dapat terhubung ke server")
      setLoading(false)
    }
  }

  const total = cartTotal(cart)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/belanja" className="text-[#2D2D2D] hover:text-[#00C559]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-bold text-[#2D2D2D]">Checkout Pesanan</h1>
          </div>
          <UserNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!mounted ? (
          <div className="text-center py-20 text-gray-500">Memuat keranjang...</div>
        ) : cart.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-16 text-center text-gray-500">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className="mb-4">Keranjang Anda masih kosong</p>
              <Link href="/belanja">
                <Button className="bg-[#00C559] hover:bg-[#00A047]">Mulai Belanja</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Barang</TableHead>
                          <TableHead className="text-right">Harga Satuan</TableHead>
                          <TableHead className="text-center">Jumlah</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.nama_barang}</TableCell>
                            <TableCell className="text-right">
                              Rp {item.harga.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-transparent"
                                  disabled={item.quantity >= item.stok}
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              Rp {(item.harga * item.quantity).toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Catatan (opsional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="catatan" className="sr-only">
                    Catatan pesanan
                  </Label>
                  <Textarea
                    id="catatan"
                    placeholder="Contoh: tolong bungkus terpisah per jenis barang"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-none shadow-sm sticky top-20">
                <CardHeader>
                  <CardTitle>Ringkasan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tanggal Transaksi</span>
                    <span>{format(new Date(), "dd MMMM yyyy", { locale: localeId })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Item</span>
                    <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} item</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Metode Pembayaran</span>
                    <span className="font-medium">QRIS</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-3">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-[#00C559] hover:bg-[#00A047]"
                    disabled={loading}
                    onClick={handleCheckout}
                  >
                    {loading ? "Memproses..." : "Buat Pesanan & Bayar dengan QRIS"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
