"use client"

// Halaman pengaturan: tab "Toko" dan "Pembayaran (QRIS)" tersambung ke database
// melalui /api/settings. Tab pengguna & notifikasi masih berupa tampilan statis.
import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload } from "lucide-react"

interface StoreSettings {
  store_name: string
  store_address: string
  store_phone: string
  store_email: string
  store_hours: string
  qris_image: string
}

const defaultSettings: StoreSettings = {
  store_name: "",
  store_address: "",
  store_phone: "",
  store_email: "",
  store_hours: "",
  qris_image: "/qris-placeholder.svg",
}

export default function PengaturanPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [qrisPreview, setQrisPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }))
      })
      .catch(() => {})
  }, [])

  const handleChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveToko = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      setMessage({ type: response.ok ? "success" : "error", text: data.message })
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setSaving(false)
    }
  }

  const handleQrisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setQrisFile(file)
    setQrisPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleUploadQris = async () => {
    if (!qrisFile) return
    setSaving(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("file", qrisFile)
      const response = await fetch("/api/settings/qris", { method: "POST", body: formData })
      const data = await response.json()
      setMessage({ type: response.ok ? "success" : "error", text: data.message })
      if (response.ok) {
        setSettings((prev) => ({ ...prev, qris_image: data.qris_image }))
        setQrisFile(null)
        setQrisPreview(null)
      }
    } catch {
      setMessage({ type: "error", text: "Tidak dapat terhubung ke server" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="toko" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="toko">Toko</TabsTrigger>
          <TabsTrigger value="pembayaran">Pembayaran (QRIS)</TabsTrigger>
          <TabsTrigger value="pengguna">Pengguna</TabsTrigger>
          <TabsTrigger value="notifikasi">Notifikasi</TabsTrigger>
        </TabsList>

        <TabsContent value="toko">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Informasi Toko</CardTitle>
              <CardDescription>
                Pengaturan informasi dasar toko Anda. Data ini juga dipakai chatbot untuk menjawab pertanyaan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="store-name">Nama Toko</Label>
                <Input
                  id="store-name"
                  value={settings.store_name}
                  onChange={(e) => handleChange("store_name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-address">Alamat</Label>
                <Textarea
                  id="store-address"
                  value={settings.store_address}
                  onChange={(e) => handleChange("store_address", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-phone">Nomor Telepon</Label>
                <Input
                  id="store-phone"
                  value={settings.store_phone}
                  onChange={(e) => handleChange("store_phone", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-email">Email</Label>
                <Input
                  id="store-email"
                  type="email"
                  value={settings.store_email}
                  onChange={(e) => handleChange("store_email", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-hours">Jam Operasional</Label>
                <Input
                  id="store-hours"
                  placeholder="Contoh: Senin - Minggu: 06.00 - 21.00 WIB"
                  value={settings.store_hours}
                  onChange={(e) => handleChange("store_hours", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#00C559] hover:bg-[#00A047]" disabled={saving} onClick={handleSaveToko}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pembayaran">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Kode QRIS Toko</CardTitle>
              <CardDescription>
                Gambar QRIS ini ditampilkan kepada pembeli pada halaman pembayaran. Unggah gambar QRIS asli dari
                penyedia pembayaran Anda (JPG/PNG/WEBP, maks. 2MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">QRIS saat ini:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.qris_image || "/qris-placeholder.svg"}
                    alt="QRIS Toko"
                    className="w-56 border rounded-lg"
                  />
                </div>
                {qrisPreview && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">QRIS baru (belum disimpan):</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrisPreview} alt="Preview QRIS baru" className="w-56 border rounded-lg" />
                  </div>
                )}
              </div>
              <div className="grid gap-2 max-w-md">
                <Label htmlFor="qris-file">Pilih gambar QRIS baru</Label>
                <Input
                  id="qris-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleQrisFileChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="bg-[#00C559] hover:bg-[#00A047]"
                disabled={!qrisFile || saving}
                onClick={handleUploadQris}
              >
                <Upload className="mr-2 h-4 w-4" />
                {saving ? "Mengunggah..." : "Simpan QRIS Baru"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pengguna">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Profil Pengguna</CardTitle>
              <CardDescription>Kelola informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="user-name">Nama Lengkap</Label>
                <Input id="user-name" defaultValue="Budi Santoso" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" type="email" defaultValue="budi@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-password">Password Baru</Label>
                <Input id="user-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-password-confirm">Konfirmasi Password</Label>
                <Input id="user-password-confirm" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#00C559] hover:bg-[#00A047]">Perbarui Profil</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifikasi">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Atur preferensi notifikasi Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-stock">Notifikasi Stok Menipis</Label>
                  <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat stok barang hampir habis</p>
                </div>
                <Switch id="notify-stock" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-sales">Notifikasi Penjualan</Label>
                  <p className="text-sm text-muted-foreground">Dapatkan notifikasi untuk setiap transaksi penjualan</p>
                </div>
                <Switch id="notify-sales" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-reports">Laporan Mingguan</Label>
                  <p className="text-sm text-muted-foreground">Terima laporan mingguan via email</p>
                </div>
                <Switch id="notify-reports" />
              </div>
              <div className="grid gap-2 pt-4">
                <Label htmlFor="stock-threshold">Batas Stok Menipis</Label>
                <Input id="stock-threshold" type="number" defaultValue="10" />
                <p className="text-sm text-muted-foreground">Jumlah minimum stok sebelum menerima notifikasi</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#00C559] hover:bg-[#00A047]">Simpan Pengaturan</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
