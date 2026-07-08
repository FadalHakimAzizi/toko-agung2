"use client"

// Halaman profil akun yang sedang login: info akun (read-only) + ganti password.
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { KeyRound } from "lucide-react"
import { useCurrentUser } from "@/lib/use-current-user"

export default function ProfilPage() {
  const { user, loading } = useCurrentUser()
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setMessage({ type: "error", text: "Konfirmasi password baru tidak cocok" })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setForm({ current_password: "", new_password: "", confirm_password: "" })
      } else {
        setMessage({ type: "error", text: data.message || "Gagal mengganti password" })
      }
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setSaving(false)
    }
  }

  const initial = user?.nama_lengkap?.trim()?.[0]?.toUpperCase() || "?"

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Profil</h1>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Info Akun</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-[#00C559] text-white text-xl">{initial}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-semibold text-[#2D2D2D]">{user.nama_lengkap}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role === "admin" ? "Administrator" : "Pembeli"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Gagal memuat data akun</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Ganti Password</CardTitle>
          <CardDescription>Password saat ini wajib diisi untuk verifikasi.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="current_password">Password Saat Ini</Label>
              <Input
                id="current_password"
                type="password"
                value={form.current_password}
                onChange={(e) => handleChange("current_password", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_password">Password Baru</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.new_password}
                onChange={(e) => handleChange("new_password", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={(e) => handleChange("confirm_password", e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="bg-[#00C559] hover:bg-[#00A047]" disabled={saving}>
              <KeyRound className="h-4 w-4 mr-2" />
              {saving ? "Menyimpan..." : "Ganti Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
