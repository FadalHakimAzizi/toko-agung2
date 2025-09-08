"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "Apakah bisa kirim file lewat HP atau email?",
    answer:
      "Ya, Anda bisa kirim file melalui WhatsApp, email, atau menggunakan form upload di website kami. Format yang didukung: PDF, Word, Excel, PowerPoint, JPG, PNG dengan maksimal ukuran 10MB.",
  },
  {
    question: "Berapa lama waktu pengerjaan untuk print dokumen?",
    answer:
      "Untuk dokumen biasa (1-50 lembar): 5-10 menit. Untuk dokumen banyak (50-500 lembar): 30-60 menit. Untuk jilid spiral/lakban: tambahan 10-15 menit. Waktu bisa lebih cepat jika tidak ada antrian.",
  },
  {
    question: "Apakah ada diskon untuk pelajar dan mahasiswa?",
    answer:
      "Ya! Kami memberikan diskon 20% untuk pelajar dan mahasiswa dengan menunjukkan kartu pelajar/mahasiswa yang masih berlaku. Diskon berlaku untuk semua layanan fotocopy dan print.",
  },
  {
    question: "Bagaimana cara pembayaran yang tersedia?",
    answer:
      "Kami menerima pembayaran tunai, transfer bank (BCA, Mandiri, BRI), e-wallet (GoPay, OVO, DANA), dan QRIS. Untuk pesanan online, pembayaran bisa dilakukan setelah barang selesai.",
  },
  {
    question: "Apakah bisa print dari flashdisk langsung?",
    answer:
      "Tentu saja! Kami menyediakan komputer untuk akses flashdisk, CD/DVD, dan memory card. Anda juga bisa print langsung dari smartphone melalui kabel USB atau Bluetooth.",
  },
  {
    question: "Apakah tersedia layanan antar/delivery?",
    answer:
      "Ya, untuk pesanan minimal Rp 50.000 dalam radius 5km dari toko. Biaya antar Rp 10.000 untuk motor dan Rp 15.000 untuk mobil. Gratis ongkir untuk pesanan di atas Rp 200.000.",
  },
  {
    question: "Bagaimana jika hasil print tidak sesuai harapan?",
    answer:
      "Kami memberikan garansi 100% untuk kepuasan pelanggan. Jika hasil tidak sesuai karena kesalahan kami, akan kami cetak ulang gratis. Untuk kesalahan file dari pelanggan, kami kenakan biaya 50% dari harga normal.",
  },
  {
    question: "Apakah bisa edit dokumen atau desain grafis?",
    answer:
      "Ya, kami menyediakan layanan editing sederhana seperti format ulang, resize, dan perbaikan kualitas gambar. Untuk desain grafis (kartu nama, brosur, banner), tersedia layanan desain dengan biaya tambahan mulai Rp 25.000.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum seputar layanan kami. Jika masih ada yang ingin ditanyakan, jangan
            ragu untuk menghubungi kami.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <div className="border-t pt-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Masih Ada Pertanyaan?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Tim customer service kami siap membantu Anda 24/7. Hubungi kami melalui WhatsApp untuk respon yang lebih
            cepat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.open("https://wa.me/6281234567890", "_blank")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              💬 Chat WhatsApp
            </button>
            <button
              onClick={() => window.open("tel:02112345678", "_blank")}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-white/30"
            >
              📞 Telepon Langsung
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
