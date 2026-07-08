"use client"

// Kontrol pagination sederhana (Sebelumnya/Selanjutnya + info halaman) dipakai
// oleh tabel admin (barang, transaksi, verifikasi). Dibuat generik supaya bisa
// dipakai ulang di ketiganya tanpa duplikasi markup.
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PaginationMeta } from "@/lib/pagination"

interface PaginationBarProps {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function PaginationBar({ pagination, onPageChange, disabled }: PaginationBarProps) {
  const { page, totalPages, total, limit } = pagination
  if (total === 0) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2 text-sm text-gray-600">
      <span>
        Menampilkan {start}–{end} dari {total} data
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Sebelumnya
        </Button>
        <span className="px-1 whitespace-nowrap">
          Halaman {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Selanjutnya <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
