"use client"

// Halaman pendaftaran akun pembeli.
// Akun baru selalu berperan 'user'; akun admin dibuat lewat seeder database.
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, ArrowLeft, UserPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (response.ok) {
        setSuccess("Pendaftaran berhasil! Mengalihkan ke halaman login...")
        setTimeout(() => router.push("/login"), 1500)
      } else {
        setError(data.message || "Pendaftaran gagal, coba lagi")
        setIsLoading(false)
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Coba beberapa saat lagi.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00C559]/10 via-white to-[#2D2D2D]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            <CardTitle className="text-2xl font-bold text-[#2D2D2D]">Daftar Akun</CardTitle>
            <CardDescription className="text-gray-600">
              Buat akun untuk berbelanja di Toko Alat Tulis Agung
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nama_lengkap"
                    type="text"
                    placeholder="Nama lengkap Anda"
                    className="pl-10"
                    value={formData.nama_lengkap}
                    onChange={(e) => handleInputChange("nama_lengkap", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username (huruf, angka, garis bawah)"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#00C559] hover:bg-[#00A047] text-white"
                disabled={isLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? "Mendaftarkan..." : "Daftar"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-[#00C559] hover:underline font-medium">
                Login di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
