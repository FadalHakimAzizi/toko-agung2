"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulasi login - ganti dengan API call yang sebenarnya
    setTimeout(() => {
      if (formData.username === "admin" && formData.password === "admin123") {
        // Login berhasil
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("user", JSON.stringify({ username: formData.username, role: "admin" }))
        window.location.href = "/dashboard"
      } else {
        setError("Username atau password salah!")
        setIsLoading(false)
      }
    }, 1000)
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
            <CardTitle className="text-2xl font-bold text-[#2D2D2D]">Login Admin</CardTitle>
            <CardDescription className="text-gray-600">Masuk ke sistem manajemen Toko Agung</CardDescription>
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

            
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">© 2024 Toko Agung. Sistem Manajemen Internal.</div>
      </div>
    </div>
  )
}
