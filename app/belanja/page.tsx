"use client"

// Halaman belanja pembeli: katalog barang dari database,
// pencarian, filter kategori, dan keranjang belanja.
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingCart, Plus, Minus, ArrowLeft, PackageX } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCart, saveCart, cartCount, type CartItem } from "@/lib/cart"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { UserNav } from "@/components/user-nav"

interface Barang {
  id: number
  kode_barang: string
  nama_barang: string
  nama_kategori: string
  harga: number
  stok: number
  satuan: string
  deskripsi: string
  gambar: string | null
  status: string
}

interface Kategori {
  id: number
  nama_kategori: string
}

export default function BelanjaPage() {
  const router = useRouter()
  const [barangList, setBarangList] = useState<Barang[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Muat katalog dari API internal
  const fetchBarang = useCallback(async (search = "") => {
    try {
      setLoading(true)
      const url = search ? `/api/barang?s=${encodeURIComponent(search)}` : "/api/barang"
      const response = await fetch(url)
      const data = await response.json()
      // Hanya barang aktif yang ditampilkan di katalog pembeli
      setBarangList((data.records || []).filter((b: Barang) => b.status === "aktif"))
    } catch {
      setBarangList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBarang()
    fetch("/api/kategori")
      .then((res) => res.json())
      .then((data) => setKategoriList(data.records || []))
      .catch(() => setKategoriList([]))
    setCart(getCart())
  }, [fetchBarang])

  // Pencarian dengan debounce seperti pola halaman barang admin
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchBarang(searchTerm)
    }, 500)
    return () => clearTimeout(delayedSearch)
  }, [searchTerm, fetchBarang])

  const filteredBarang = barangList.filter((barang) => {
    if (selectedCategory === "Semua") return true
    return barang.nama_kategori === selectedCategory
  })

  const getQuantityInCart = (id: number) => cart.find((item) => item.id === id)?.quantity ?? 0

  const updateCart = (barang: Barang, newQuantity: number) => {
    // Validasi: jumlah tidak boleh minus dan tidak boleh melebihi stok
    const quantity = Math.max(0, Math.min(newQuantity, barang.stok))
    let newCart: CartItem[]
    if (quantity === 0) {
      newCart = cart.filter((item) => item.id !== barang.id)
    } else if (cart.some((item) => item.id === barang.id)) {
      newCart = cart.map((item) => (item.id === barang.id ? { ...item, quantity, stok: barang.stok } : item))
    } else {
      newCart = [
        ...cart,
        {
          id: barang.id,
          nama_barang: barang.nama_barang,
          harga: barang.harga,
          quantity,
          stok: barang.stok,
          satuan: barang.satuan,
          gambar: barang.gambar,
        },
      ]
    }
    setCart(newCart)
    saveCart(newCart)
  }

  const totalItems = cartCount(cart)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header halaman belanja */}
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-[#2D2D2D] hover:text-[#00C559]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Image src="/logoTokoAgung.png" alt="Toko Agung" width={32} height={32} className="w-8 h-8" />
            <h1 className="font-bold text-[#2D2D2D] truncate">Belanja - Toko Agung</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pesanan">
              <Button variant="outline" size="sm">
                Pesanan Saya
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-[#00C559] hover:bg-[#00A047] relative"
              onClick={() => router.push("/checkout")}
              disabled={totalItems === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Keranjang
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Pencarian & filter kategori */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau kode barang..."
              className="pl-8 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-56 bg-white">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Kategori</SelectItem>
              {kategoriList.map((kategori) => (
                <SelectItem key={kategori.id} value={kategori.nama_kategori}>
                  {kategori.nama_kategori}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Katalog barang */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Memuat katalog...</div>
        ) : filteredBarang.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <PackageX className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            Barang tidak ditemukan
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBarang.map((barang) => {
              const qty = getQuantityInCart(barang.id)
              const habis = barang.stok <= 0
              return (
                <Card key={barang.id} className="border shadow-sm rounded-xl overflow-hidden flex flex-col py-0 gap-0">
                  <div className="relative w-full h-32 sm:h-40 bg-gray-100">
                    {barang.gambar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={barang.gambar}
                        alt={barang.nama_barang}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Tidak ada gambar
                      </div>
                    )}
                    {habis && (
                      <Badge className="absolute top-2 right-2 bg-red-500">Stok Habis</Badge>
                    )}
                  </div>
                  <CardContent className="p-3 flex flex-col flex-1 gap-1">
                    <p className="text-xs text-gray-500">{barang.nama_kategori}</p>
                    <h3 className="text-sm font-semibold text-[#2D2D2D] line-clamp-2">{barang.nama_barang}</h3>
                    <p className="text-[#00C559] font-bold text-sm">Rp {barang.harga.toLocaleString("id-ID")}</p>
                    <p className="text-xs text-gray-500">
                      Stok: {barang.stok} {barang.satuan}
                    </p>
                    <div className="mt-auto pt-2">
                      {qty === 0 ? (
                        <Button
                          size="sm"
                          className="w-full bg-[#00C559] hover:bg-[#00A047]"
                          disabled={habis}
                          onClick={() => updateCart(barang, 1)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Tambah
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateCart(barang, qty - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">{qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={qty >= barang.stok}
                            onClick={() => updateCart(barang, qty + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
