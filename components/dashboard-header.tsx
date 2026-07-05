"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, Menu, Settings, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { sidebarItems } from "@/components/sidebar-nav"

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const handleLogout = async () => {
    // Hapus sesi di server (cookie httpOnly) lalu bersihkan info tampilan
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Tetap lanjut logout di sisi client walau server tidak terjangkau
    }
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <header className="border-b bg-white px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Menu navigasi untuk layar mobile (sidebar desktop tersembunyi) */}
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <Image src="/logoTokoAgung.png" alt="Toko Agung Logo" width={24} height={24} className="w-6 h-6" />
                  <span className="text-[#2D2D2D]">Toko Agung</span>
                </Link>
              </div>
              <nav className="grid items-start px-2 py-2 text-sm font-medium">
                {sidebarItems.map((item, index) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
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
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-semibold text-[#2D2D2D] truncate">
              Sistem Manajemen Toko Agung
            </h2>
            <p className="hidden sm:block text-sm text-gray-600">Kelola toko alat tulis Anda dengan mudah</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#00C559] text-white">A</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
