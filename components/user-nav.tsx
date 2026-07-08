"use client"

// Navigasi akun dipakai di landing page & halaman pembeli (belanja, checkout,
// pembayaran, pesanan). Sebelumnya halaman-halaman ini selalu menampilkan
// tombol "Login" meskipun pengguna sudah login — komponen ini menyesuaikan
// tampilan berdasarkan status login yang sebenarnya (lihat lib/use-current-user.ts).
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, LogOut, ShoppingBag } from "lucide-react"
import { useCurrentUser } from "@/lib/use-current-user"

interface UserNavProps {
  // "mobile": tombol susun vertikal & full-width (dipakai di drawer menu mobile)
  variant?: "desktop" | "mobile"
}

export function UserNav({ variant = "desktop" }: UserNavProps) {
  const router = useRouter()
  const { user, loading, refresh } = useCurrentUser()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Tetap lanjut logout di sisi client walau server tidak terjangkau
    }
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
    await refresh()
    router.push("/")
  }

  // Placeholder seukuran tombol asli supaya tidak ada "kedipan" layout saat status login masih dimuat
  if (loading) {
    return <div className={variant === "mobile" ? "h-10" : "h-9 w-40"} aria-hidden />
  }

  if (!user) {
    if (variant === "mobile") {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-[#00C559] text-[#00C559]"
            onClick={() => router.push("/belanja")}
          >
            Belanja Online
          </Button>
          <Button className="flex-1 bg-[#2D2D2D] hover:bg-black text-white" onClick={() => router.push("/login")}>
            Login
          </Button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="border-[#00C559] text-[#00C559] hover:bg-[#00C559]/5 bg-transparent"
          onClick={() => router.push("/belanja")}
        >
          Belanja Online
        </Button>
        <Button size="sm" className="bg-[#00C559] hover:bg-[#00A047] text-white" onClick={() => router.push("/login")}>
          Login
        </Button>
      </div>
    )
  }

  const initial = user.nama_lengkap?.trim()?.[0]?.toUpperCase() || "U"
  const goToAccountHome = () => router.push(user.role === "admin" ? "/dashboard" : "/pesanan")

  if (variant === "mobile") {
    return (
      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-[#00C559] text-white">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-[#2D2D2D] truncate">{user.nama_lengkap}</p>
            <p className="text-xs text-gray-500">{user.role === "admin" ? "Administrator" : "Pembeli"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={goToAccountHome}>
            {user.role === "admin" ? <LayoutDashboard className="h-4 w-4 mr-1" /> : <ShoppingBag className="h-4 w-4 mr-1" />}
            {user.role === "admin" ? "Dashboard" : "Pesanan Saya"}
          </Button>
          <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Keluar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#00C559] text-white text-xs">{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium max-w-[140px] truncate">{user.nama_lengkap}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium truncate">{user.nama_lengkap}</p>
          <p className="text-xs font-normal text-gray-500">{user.role === "admin" ? "Administrator" : "Pembeli"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={goToAccountHome}>
          {user.role === "admin" ? (
            <>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" /> Pesanan Saya
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
