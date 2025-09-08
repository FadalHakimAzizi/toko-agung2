"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Product {
  name: string
  category: string
  sold: number
  revenue: number
}

interface TopProductsTableProps {
  products?: Product[] // Jadikan prop opsional agar lebih aman
}

// Tambahkan " = [] " untuk memberikan nilai default jika prop products tidak ada
export function TopProductsTable({ products = [] }: TopProductsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Barang</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Terjual</TableHead>
            <TableHead className="text-right">Pendapatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-right">{product.sold}</TableCell>
                <TableCell className="text-right">Rp {product.revenue.toLocaleString('id-ID')}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                Belum ada data penjualan.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
