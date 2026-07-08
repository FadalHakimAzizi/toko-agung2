import { describe, it, expect } from "vitest"
import { getCart, cartTotal, cartCount, type CartItem } from "@/lib/cart"

const items: CartItem[] = [
  { id: 1, nama_barang: "Pulpen", harga: 4000, quantity: 3, stok: 100, satuan: "pcs" },
  { id: 2, nama_barang: "Buku Tulis", harga: 10000, quantity: 2, stok: 50, satuan: "pcs" },
]

describe("cartTotal", () => {
  it("sums price * quantity across items", () => {
    expect(cartTotal(items)).toBe(4000 * 3 + 10000 * 2)
  })

  it("is 0 for an empty cart", () => {
    expect(cartTotal([])).toBe(0)
  })
})

describe("cartCount", () => {
  it("sums quantities across items", () => {
    expect(cartCount(items)).toBe(5)
  })

  it("is 0 for an empty cart", () => {
    expect(cartCount([])).toBe(0)
  })
})

describe("getCart", () => {
  it("returns an empty array when there is no window (server/test environment)", () => {
    expect(getCart()).toEqual([])
  })
})
