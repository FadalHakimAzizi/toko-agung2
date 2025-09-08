"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function PengaturanPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>

      <Tabs defaultValue="toko" className="space-y-4">
        <TabsList>
          <TabsTrigger value="toko">Toko</TabsTrigger>
          <TabsTrigger value="pengguna">Pengguna</TabsTrigger>
          <TabsTrigger value="notifikasi">Notifikasi</TabsTrigger>
        </TabsList>

        <TabsContent value="toko">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Informasi Toko</CardTitle>
              <CardDescription>Pengaturan informasi dasar toko Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="store-name">Nama Toko</Label>
                <Input id="store-name" defaultValue="Toko Agung" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-address">Alamat</Label>
                <Textarea id="store-address" defaultValue="Jl. Pendidikan No. 45, Jakarta Timur, 13220" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-phone">Nomor Telepon</Label>
                <Input id="store-phone" defaultValue="0812-3456-7890" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-email">Email</Label>
                <Input id="store-email" type="email" defaultValue="info@tokoagung.com" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#00C559] hover:bg-[#00A047]">Simpan Perubahan</Button>
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
