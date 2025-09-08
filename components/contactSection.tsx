"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Phone, Mail, MapPin, Clock, Send } from "lucide-react"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert("Pesan Anda telah terkirim! Kami akan menghubungi Anda segera.")
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
  }

  const sendWhatsAppMessage = () => {
    const message = `Halo CopyCenter!

Nama: ${formData.name}
Email: ${formData.email}
Telepon: ${formData.phone}
Subjek: ${formData.subject}

Pesan:
${formData.message}`

    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Siap melayani kebutuhan printing Anda. Hubungi kami sekarang untuk konsultasi gratis dan penawaran terbaik.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Kirim Pesan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Masukkan nama Anda"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor HP *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="08xx-xxxx-xxxx"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="nama@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subjek</Label>
                  <Select onValueChange={(value) => handleInputChange("subject", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih subjek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info-harga">Informasi Harga</SelectItem>
                      <SelectItem value="pesanan-khusus">Pesanan Khusus</SelectItem>
                      <SelectItem value="keluhan">Keluhan/Saran</SelectItem>
                      <SelectItem value="kerjasama">Kerjasama</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Pesan *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Tulis pesan Anda di sini..."
                    rows={5}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Pesan
                  </Button>
                  <Button
                    type="button"
                    onClick={sendWhatsAppMessage}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Via WhatsApp
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Informasi Kontak</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">WhatsApp</h4>
                      <p className="text-gray-600 mb-2">0812-3456-7890</p>
                      <p className="text-sm text-gray-500">Respon cepat 24/7</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Telepon</h4>
                      <p className="text-gray-600 mb-2">(021) 1234-5678</p>
                      <p className="text-sm text-gray-500">Jam operasional toko</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                      <p className="text-gray-600 mb-2">info@tokoagung.com</p>
                      <p className="text-sm text-gray-500">Respon dalam 2-4 jam</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Alamat</h4>
                      <p className="text-gray-600 mb-2">
                        Jl. Syekh Bayanillah No.609
                        <br />
                        Setu Wetan
                      </p>
                      <p className="text-sm text-gray-500">Dekat kampus dan perkantoran</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Jam Buka</h4>
                      <div className="text-gray-600 space-y-1">
                        <p>Senin - Jumat: 06:00 - 21:00</p>
                        <p>Sabtu: 06:00 - 21:00</p>
                        <p>Minggu: 06:00 - 21:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-none shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Aksi Cepat</h3>
                <div className="space-y-4">
                  <Button
                    onClick={() =>
                      window.open(
                        "https://wa.me/6281234567890?text=Halo, saya ingin bertanya tentang layanan CopyCenter",
                        "_blank",
                      )
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat WhatsApp Sekarang
                  </Button>
                  <Button
                    onClick={() => window.open("tel:02112345678", "_blank")}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Telepon Langsung
                  </Button>
                  <Button
                    onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Upload File Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-red-800 mb-2">🚨 Pesanan Urgent?</h4>
              <p className="text-sm text-red-700 mb-3">
                Untuk pesanan mendesak di luar jam operasional, hubungi nomor darurat:
              </p>
              <p className="font-semibold text-red-800">0812-3456-7890 (WhatsApp Only)</p>
              <p className="text-xs text-red-600 mt-1">
                *Berlaku untuk pesanan minimal Rp 100.000 dengan biaya tambahan 25%
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
