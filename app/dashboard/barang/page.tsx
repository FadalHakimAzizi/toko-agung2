"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Search, Trash2, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types
interface Barang {
  id: number
  kode_barang: string
  nama_barang: string
  nama_kategori: string
  harga: number
  stok: number
  stok_minimum: number
  satuan: string
  deskripsi: string
  status: string
}

interface Kategori {
  id: number
  nama_kategori: string
  deskripsi: string
}

export default function BarangPage() {
  const [barangList, setBarangList] = useState<Barang[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    nama_barang: "",
    kategori_id: "",
    harga: "",
    stok: "",
    stok_minimum: "10",
    satuan: "pcs",
    deskripsi: "",
  })

  // API Base URL - sesuaikan dengan setup server Anda
  const API_BASE = "https://toko-agung.my.id/toko-agung-api/api"

  // Fetch data barang
  const fetchBarang = async (search = "") => {
    try {
      setLoading(true)
      const url = search ? `${API_BASE}/barang/read.php?s=${encodeURIComponent(search)}` : `${API_BASE}/barang/read.php`
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok && data.records) {
        setBarangList(data.records)
      } else {
        setBarangList([])
      }
    } catch (error) {
      console.error("Error fetching barang:", error)
      setError("Gagal memuat data barang")
      setBarangList([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data kategori
  const fetchKategori = async () => {
    try {
      const response = await fetch(`${API_BASE}/kategori/read.php`)
      const data = await response.json()

      if (response.ok && data.records) {
        setKategoriList(data.records)
      }
    } catch (_) {
      console.error("Error fetching kategori")
    }
  }

  // Load data saat komponen dimount
  useEffect(() => {
    fetchBarang()
    fetchKategori()
  }, [])

  // Handle search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm) {
        fetchBarang(searchTerm)
      } else {
        fetchBarang()
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  // Filter berdasarkan kategori
  const filteredBarang = barangList.filter((barang) => {
    if (selectedCategory === "Semua") return true
    return barang.nama_kategori === selectedCategory
  })

  // Handle form input change
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_barang: "",
      kategori_id: "",
      harga: "",
      stok: "",
      stok_minimum: "10",
      satuan: "pcs",
      deskripsi: "",
    })
  }

  // Handle tambah barang
  const handleAddBarang = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_BASE}/barang/create.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Barang berhasil ditambahkan!")
        setIsAddDialogOpen(false)
        resetForm()
        fetchBarang()
      } else {
        setError(data.message || "Gagal menambahkan barang")
      }
    } catch (_) {
      setError("Terjadi kesalahan saat menambahkan barang")
    } finally {
      setLoading(false)
    }
  }

  // Handle edit barang
  const handleEditBarang = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBarang) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const updateData = {
        id: editingBarang.id,
        ...formData,
        status: editingBarang.status,
      }

      const response = await fetch(`${API_BASE}/barang/update.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Barang berhasil diupdate!")
        setIsEditDialogOpen(false)
        setEditingBarang(null)
        resetForm()
        fetchBarang()
      } else {
        setError(data.message || "Gagal mengupdate barang")
      }
    } catch (_) {
      setError("Terjadi kesalahan saat mengupdate barang")
    } finally {
      setLoading(false)
    }
  }

  // Handle hapus barang
  const handleDeleteBarang = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus barang ini?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_BASE}/barang/delete.php`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Barang berhasil dihapus!")
        fetchBarang()
      } else {
        setError(data.message || "Gagal menghapus barang")
      }
    } catch (_) {
      console.error("Error fetching barang")
      setError("Gagal memuat data barang")
      setBarangList([])
    } finally {
      setLoading(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (barang: Barang) => {
    setEditingBarang(barang)
    setFormData({
      nama_barang: barang.nama_barang,
      kategori_id: kategoriList.find((k) => k.nama_kategori === barang.nama_kategori)?.id.toString() || "",
      harga: barang.harga.toString(),
      stok: barang.stok.toString(),
      stok_minimum: barang.stok_minimum.toString(),
      satuan: barang.satuan,
      deskripsi: barang.deskripsi,
    })
    setIsEditDialogOpen(true)
  }

  // Get unique categories for filter
  const categories = ["Semua", ...Array.from(new Set(barangList.map((b) => b.nama_kategori)))]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Data Barang</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00C559] hover:bg-[#00A047]" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Barang Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBarang} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nama_barang">Nama Barang *</Label>
                  <Input
                    id="nama_barang"
                    value={formData.nama_barang}
                    onChange={(e) => handleInputChange("nama_barang", e.target.value)}
                    placeholder="Masukkan nama barang"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kategori_id">Kategori *</Label>
                  <Select onValueChange={(value) => handleInputChange("kategori_id", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {kategoriList.map((kategori) => (
                        <SelectItem key={kategori.id} value={kategori.id.toString()}>
                          {kategori.nama_kategori}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="harga">Harga (Rp) *</Label>
                  <Input
                    id="harga"
                    type="number"
                    value={formData.harga}
                    onChange={(e) => handleInputChange("harga", e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stok">Stok *</Label>
                  <Input
                    id="stok"
                    type="number"
                    value={formData.stok}
                    onChange={(e) => handleInputChange("stok", e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stok_minimum">Stok Minimum</Label>
                  <Input
                    id="stok_minimum"
                    type="number"
                    value={formData.stok_minimum}
                    onChange={(e) => handleInputChange("stok_minimum", e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="satuan">Satuan</Label>
                <Select onValueChange={(value) => handleInputChange("satuan", value)} defaultValue="pcs">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pcs</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="rim">Rim</SelectItem>
                    <SelectItem value="lusin">Lusin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => handleInputChange("deskripsi", e.target.value)}
                  placeholder="Deskripsi barang (opsional)"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-[#00C559] hover:bg-[#00A047]" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari barang..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredBarang.length > 0 ? (
              filteredBarang.map((barang) => (
                <TableRow key={barang.id}>
                  <TableCell className="font-mono text-sm">{barang.kode_barang}</TableCell>
                  <TableCell className="font-medium">{barang.nama_barang}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{barang.nama_kategori}</Badge>
                  </TableCell>
                  <TableCell className="text-right">Rp {barang.harga.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={barang.stok <= barang.stok_minimum ? "text-red-500 font-semibold" : ""}>
                      {barang.stok} {barang.satuan}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(barang)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBarang(barang.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada data barang yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Barang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBarang} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_nama_barang">Nama Barang *</Label>
                <Input
                  id="edit_nama_barang"
                  value={formData.nama_barang}
                  onChange={(e) => handleInputChange("nama_barang", e.target.value)}
                  placeholder="Masukkan nama barang"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_kategori_id">Kategori *</Label>
                <Select value={formData.kategori_id} onValueChange={(value) => handleInputChange("kategori_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriList.map((kategori) => (
                      <SelectItem key={kategori.id} value={kategori.id.toString()}>
                        {kategori.nama_kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_harga">Harga (Rp) *</Label>
                <Input
                  id="edit_harga"
                  type="number"
                  value={formData.harga}
                  onChange={(e) => handleInputChange("harga", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_stok">Stok *</Label>
                <Input
                  id="edit_stok"
                  type="number"
                  value={formData.stok}
                  onChange={(e) => handleInputChange("stok", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_stok_minimum">Stok Minimum</Label>
                <Input
                  id="edit_stok_minimum"
                  type="number"
                  value={formData.stok_minimum}
                  onChange={(e) => handleInputChange("stok_minimum", e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_satuan">Satuan</Label>
              <Select value={formData.satuan} onValueChange={(value) => handleInputChange("satuan", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pcs</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="rim">Rim</SelectItem>
                  <SelectItem value="lusin">Lusin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_deskripsi">Deskripsi</Label>
              <Textarea
                id="edit_deskripsi"
                value={formData.deskripsi}
                onChange={(e) => handleInputChange("deskripsi", e.target.value)}
                placeholder="Deskripsi barang (opsional)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingBarang(null)
                  resetForm()
                }}
              >
                Batal
              </Button>
              <Button type="submit" className="bg-[#00C559] hover:bg-[#00A047]" disabled={loading}>
                {loading ? "Menyimpan..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
