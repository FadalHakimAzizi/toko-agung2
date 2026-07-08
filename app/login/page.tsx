"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCurrentUser } from "@/lib/use-current-user"

export default function LoginPage() {
  // Kalau ternyata sudah login, tidak perlu menampilkan form login lagi —
  // langsung arahkan ke halaman yang sesuai perannya.
  const { user, loading: checkingSession } = useCurrentUser()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!checkingSession && user) {
      window.location.href = user.role === "admin" ? "/dashboard" : "/belanja"
    }
  }, [checkingSession, user])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Login sungguhan ke API internal; sesi disimpan di cookie httpOnly
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (response.ok) {
        // Info user disimpan hanya untuk tampilan header (bukan untuk otorisasi)
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("user", JSON.stringify(data.user))
        // Admin ke dashboard, pembeli ke halaman belanja
        window.location.href = data.user.role === "admin" ? "/dashboard" : "/belanja"
      } else {
        setError(data.message || "Username atau password salah!")
        setIsLoading(false)
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Pastikan database sudah dikonfigurasi.")
      setIsLoading(false)
    }
  }

  // Sedang mengecek sesi, atau sudah login (menunggu redirect di atas) — tampilkan loading, bukan form
  if (checkingSession || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C559] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00C559]/10 via-white to-[#2D2D2D]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#2D2D2D] hover:text-[#00C559] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <Image
                src="/logoTokoAgung.png"
                alt="Toko Agung Logo"
                width={60}
                height={60}
                className="w-15 h-15"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-[#2D2D2D]">Login</CardTitle>
            <CardDescription className="text-gray-600">
              Masuk sebagai admin atau pembeli Toko Agung
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#2D2D2D] font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    placeholder="Masukkan username"
                    className="pl-10 border-gray-300 focus:border-[#00C559] focus:ring-[#00C559]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#2D2D2D] font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Masukkan password"
                    className="pl-10 pr-10 border-gray-300 focus:border-[#00C559] focus:ring-[#00C559]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#00C559] hover:bg-[#00A047] text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link href="/register" className="text-[#00C559] hover:underline font-medium">
                Daftar di sini
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">© 2024 Toko Agung. Sistem Manajemen Internal.</div>
      </div>
    </div>
  )
}
