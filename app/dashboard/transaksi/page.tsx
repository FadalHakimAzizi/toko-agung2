"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, Plus, Printer, Save, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types
interface Barang {
  id: number;
  nama_barang: string;
  harga: number;
  stok: number;
}

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  total: number
}

const API_BASE = "https://toko-agung.my.id/toko-agung-api/api"

export default function TransaksiPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Barang[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Fetch produk berdasarkan pencarian
  useEffect(() => {
    const fetchProducts = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/barang/read.php?s=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        if (data.records) {
          setSearchResults(data.records);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(() => {
        fetchProducts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const addToCart = (product: Barang) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.nama_barang,
          price: product.harga,
          quantity: 1,
          total: product.harga,
        },
      ])
    }
    setSearchTerm("")
    setShowResults(false)
  }

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.price,
            }
          : item,
      ),
    )
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const resetCart = () => {
    setCart([])
  }

  const saveTransaction = async () => {
    setLoading(true);
    setMessage(null);

    const transactionData = {
        items: cart,
        totalHarga: calculateTotal(),
        metodePembayaran: 'Tunai'
    };

    try {
        const response = await fetch(`${API_BASE}/transaksi/create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });

        const result = await response.json();

        if(response.ok) {
            setMessage({ type: 'success', text: result.message || 'Transaksi berhasil disimpan!'});
            resetCart();
        } else {
            setMessage({ type: 'error', text: result.message || 'Gagal menyimpan transaksi.'});
        }

    } catch (error) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan koneksi.' });
    } finally {
        setLoading(false);
        setTimeout(() => setMessage(null), 5000);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Transaksi Penjualan</h1>
        {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{message.text}</AlertDescription>
            </Alert>
        )}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Keranjang Belanja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau kode barang..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowResults(e.target.value.length > 0)
                  }}
                  onFocus={() => {
                    if (searchTerm.length > 0) setShowResults(true)
                  }}
                />
                {showResults && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onClick={() => addToCart(product)}
                        >
                          <span>{product.nama_barang} (Stok: {product.stok})</span>
                          <Badge variant="outline">Rp {product.harga.toLocaleString()}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">Barang tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.length > 0 ? (
                      cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">Rp {item.price.toLocaleString()}</TableCell>
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
                              <span className="w-12 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">Rp {item.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Belum ada barang di keranjang
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rp {calculateTotal().toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#00C559] hover:bg-[#00A047]"
                disabled={cart.length === 0 || loading}
                onClick={saveTransaction}
              >
                <Save className="mr-2 h-4 w-4" /> {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
              </Button>
             
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
