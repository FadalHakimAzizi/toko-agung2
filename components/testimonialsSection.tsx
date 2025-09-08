"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Putri",
    role: "Mahasiswa UI",
    image:
      "/sarah.jpg",
    rating: 5,
    text:
      "Pelayanan sangat cepat dan hasil print berkualitas tinggi! Harga juga sangat terjangkau untuk kantong mahasiswa. Sudah langganan di sini sejak semester 1.",
    highlight: "Pelayanan cepat dan berkualitas",
  },
  {
    name: "Budi Santoso",
    role: "Karyawan Swasta",
    image: "/pelayan-toko.jpg",
    rating: 5,
    // Escape tanda kutip ganda di dalam string
    text:
      "Lokasi strategis dekat kantor, buka sampai malam, dan staff yang ramah. Cocok banget buat yang sering lembur dan butuh print mendadak.",
    highlight: "Lokasi strategis dan buka sampai malam",
  },
  {
    name: "Dr. Maya Sari",
    role: "Dosen",
    image:
      "/drMaya.jpg",
    rating: 5,
    text:
      "Untuk kebutuhan print materi kuliah dan penelitian, CopyCenter selalu jadi pilihan utama. Hasil jilid spiral rapi dan tahan lama.",
    highlight: "Hasil jilid rapi dan tahan lama",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Testimoni Pelanggan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dengarkan langsung dari pelanggan setia kami tentang pengalaman
            menggunakan layanan CopyCenter.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-none shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-15 h-15 rounded-full overflow-hidden border-2 border-blue-100">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-blue-200" />
                  <p className="text-gray-700 italic mb-4 pl-6">
                    &quot;{testimonial.text}&quot;
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-800">
                    💡 {testimonial.highlight}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Pelanggan Puas</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Dokumen Dicetak</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">8+</div>
              <div className="text-blue-100">Tahun Pengalaman</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">4.9/5</div>
              <div className="text-blue-100">Rating Pelanggan</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
