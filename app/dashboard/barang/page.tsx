"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Search, Trash2, AlertTriangle, Upload, ImageOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { PaginationMeta } from "@/lib/pagination"

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
  gambar: string | null
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
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nama_barang: "",
    kategori_id: "",
    harga: "",
    stok: "",
    stok_minimum: "10",
    satuan: "pcs",
    deskripsi: "",
    gambar: "", // path gambar yang sudah tersimpan (hasil upload atau data lama saat edit)
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // API internal Next.js (menggantikan API PHP eksternal yang sudah tidak aktif)
  const API_BASE = "/api"
  const PAGE_SIZE = 20

  // Fetch data barang (server-side search, filter kategori, & pagination)
  const fetchBarang = async (targetPage: number, search: string, kategori: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) })
      if (search) params.set("s", search)
      if (kategori && kategori !== "Semua") params.set("kategori", kategori)

      const response = await fetch(`${API_BASE}/barang?${params.toString()}`)
      const data = await response.json()

      if (response.ok && data.records) {
        setBarangList(data.records)
        setPagination(data.pagination ?? null)
      } else {
        setBarangList([])
        setPagination(null)
      }
    } catch (error) {
      console.error("Error fetching barang:", error)
      setError("Gagal memuat data barang")
      setBarangList([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data kategori
  const fetchKategori = async () => {
    try {
      const response = await fetch(`${API_BASE}/kategori`)
      const data = await response.json()

      if (response.ok && data.records) {
        setKategoriList(data.records)
      }
    } catch {
      console.error("Error fetching kategori")
    }
  }

  useEffect(() => {
    fetchKategori()
  }, [])

  // Cari/filter kategori mengubah hasil → kembali ke halaman 1 (debounce
  // untuk pencarian supaya tidak fetch di setiap ketikan)
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setPage(1)
      fetchBarang(1, searchTerm, selectedCategory)
    }, 400)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, selectedCategory])

  const goToPage = (targetPage: number) => {
    setPage(targetPage)
    fetchBarang(targetPage, searchTerm, selectedCategory)
  }

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
      gambar: "",
    })
    setImageFile(null)
    setImagePreview(null)
  }

  // Pratinjau gambar yang baru dipilih (belum diunggah)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  // Unggah gambar yang dipilih (jika ada) dan kembalikan path publiknya.
  // Kalau tidak ada gambar baru, kembalikan path yang sudah ada di form
  // (supaya gambar lama tidak terhapus saat edit tanpa ganti foto).
  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (!imageFile) return formData.gambar || null
    setUploadingImage(true)
    try {
      const uploadForm = new FormData()
      uploadForm.append("file", imageFile)
      const response = await fetch(`${API_BASE}/barang/gambar`, { method: "POST", body: uploadForm })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Gagal mengunggah gambar")
      return data.gambar as string
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle tambah barang
  const handleAddBarang = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const gambar = await uploadImageIfNeeded()
      const response = await fetch(`${API_BASE}/barang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, gambar }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Barang berhasil ditambahkan!")
        setIsAddDialogOpen(false)
        resetForm()
        fetchBarang(page, searchTerm, selectedCategory)
      } else {
        setError(data.message || "Gagal menambahkan barang")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menambahkan barang")
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
      const gambar = await uploadImageIfNeeded()
      const updateData = {
        id: editingBarang.id,
        ...formData,
        gambar,
        status: editingBarang.status,
      }

      const response = await fetch(`${API_BASE}/barang`, {
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
        fetchBarang(page, searchTerm, selectedCategory)
      } else {
        setError(data.message || "Gagal mengupdate barang")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengupdate barang")
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
      const response = await fetch(`${API_BASE}/barang`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Barang berhasil dihapus!")
        // Kalau barang yang dihapus adalah satu-satunya di halaman ini
        // (dan bukan halaman pertama), mundur satu halaman biar tidak kosong.
        const nextPage = barangList.length === 1 && page > 1 ? page - 1 : page
        setPage(nextPage)
        fetchBarang(nextPage, searchTerm, selectedCategory)
      } else {
        setError(data.message || "Gagal menghapus barang")
      }
    } catch {
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
      gambar: barang.gambar ?? "",
    })
    setImageFile(null)
    setImagePreview(barang.gambar ?? null)
    setIsEditDialogOpen(true)
  }

  // Daftar kategori untuk filter — dari kategoriList (semua kategori), bukan
  // dari barangList, karena barangList sekarang hanya berisi 1 halaman data.
  const categories = ["Semua", ...kategoriList.map((k) => k.nama_kategori)]

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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid gap-2">
                <Label htmlFor="gambar">Foto Barang (opsional, maks. 2MB)</Label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Pratinjau" className="h-16 w-16 rounded-md border object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-md border bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}
                  <Input id="gambar" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-[#00C559] hover:bg-[#00A047]" disabled={loading || uploadingImage}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? "Mengunggah foto..." : loading ? "Menyimpan..." : "Simpan"}
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

      {/* Table (bisa discroll horizontal di layar kecil) */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : barangList.length > 0 ? (
              barangList.map((barang) => (
                <TableRow key={barang.id}>
                  <TableCell>
                    {barang.gambar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={barang.gambar} alt={barang.nama_barang} className="h-10 w-10 rounded-md border object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md border bg-gray-50 flex items-center justify-center text-gray-300">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data barang yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && <PaginationBar pagination={pagination} onPageChange={goToPage} disabled={loading} />}

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
            <div className="grid gap-2">
              <Label htmlFor="edit_gambar">Foto Barang (opsional, maks. 2MB)</Label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Pratinjau" className="h-16 w-16 rounded-md border object-cover shrink-0" />
                ) : (
                  <div className="h-16 w-16 rounded-md border bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
                <Input id="edit_gambar" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} />
              </div>
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
              <Button type="submit" className="bg-[#00C559] hover:bg-[#00A047]" disabled={loading || uploadingImage}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadingImage ? "Mengunggah foto..." : loading ? "Menyimpan..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
