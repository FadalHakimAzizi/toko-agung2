// Helper keranjang belanja pembeli — disimpan di localStorage
// agar isi keranjang tidak hilang saat halaman berpindah/di-refresh.
export interface CartItem {
  id: number
  nama_barang: string
  harga: number
  quantity: number
  stok: number
  satuan: string
  gambar?: string | null
}

const CART_KEY = "keranjang"

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  // Memberi tahu komponen lain (misal badge jumlah di header) bahwa keranjang berubah
  window.dispatchEvent(new Event("cart-updated"))
}

export function clearCart(): void {
  saveCart([])
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.harga * item.quantity, 0)
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
