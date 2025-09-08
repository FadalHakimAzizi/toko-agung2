"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Home, Package, Settings, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Data Barang",
    href: "/dashboard/barang",
    icon: Package,
  },
  {
    title: "Transaksi",
    href: "/dashboard/transaksi",
    icon: ShoppingCart,
  },
  {
    title: "Laporan",
    href: "/dashboard/laporan",
    icon: FileText,
  },
  {
    title: "Pengaturan",
    href: "/dashboard/pengaturan",
    icon: Settings,
  },
]

interface SidebarNavProps {
  omsetBulanIni?: number;
}

export function SidebarNav({ omsetBulanIni }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-white md:block md:w-64">
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Image src="/logoTokoAgung.png" alt="Toko Agung Logo" width={24} height={24} className="w-6 h-6" />
            <span className="text-[#2D2D2D]">Toko Agung</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActive ? "bg-[#00C559]/10 text-[#00C559]" : "text-gray-500 hover:text-[#00C559]",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-2 rounded-lg bg-[#00C559]/10 p-4">
            <BarChart3 className="h-5 w-5 text-[#00C559]" />
            <div>
              <p className="text-sm font-medium text-[#2D2D2D]">Omset Bulan Ini</p>
              <p className="text-lg font-bold text-[#00C559]">
                {omsetBulanIni !== undefined 
                  ? `Rp ${omsetBulanIni.toLocaleString('id-ID')}` 
                  : 'Memuat...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}