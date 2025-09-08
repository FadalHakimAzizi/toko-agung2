import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const pricingData = [
  {
    category: "Alat Tulis Dasar",
    items: [
      { service: "Pulpen Standard", price: "Rp 2.000", unit: "/pcs" },
      { service: "Pensil 2B", price: "Rp 1.500", unit: "/pcs" },
      { service: "Penghapus Kecil", price: "Rp 1.000", unit: "/pcs" },
      { service: "Spidol Whiteboard", price: "Rp 5.000", unit: "/pcs" },
    ],
  },
  {
    category: "Buku & Kertas",
    items: [
      { service: "Buku Tulis 38 lembar", price: "Rp 3.000", unit: "/pcs" },
      { service: "Buku Tulis 58 lembar", price: "Rp 4.500", unit: "/pcs" },
      { service: "Kertas HVS A4 (1 rim)", price: "Rp 45.000", unit: "/rim" },
      { service: "Buku Gambar A4", price: "Rp 8.000", unit: "/pcs" },
    ],
  },
  {
    category: "Perlengkapan Lainnya",
    items: [
      { service: "Penggaris 30cm", price: "Rp 3.000", unit: "/pcs" },
      { service: "Set Jangka", price: "Rp 25.000", unit: "/set" },
      { service: "Kalkulator Scientific", price: "Rp 85.000", unit: "/pcs" },
      { service: "Tempat Pensil", price: "Rp 15.000", unit: "/pcs" },
    ],
  },
]

const promos = [
  {
    title: "Diskon Pelajar 15%",
    description: "Khusus untuk pelajar dan mahasiswa dengan menunjukkan kartu pelajar/mahasiswa",
    badge: "Populer",
  },
  {
    title: "Paket Sekolah Hemat",
    description: "Paket lengkap alat tulis sekolah mulai dari Rp 50.000 untuk 1 semester",
    badge: "Hemat",
  },
  {
    title: "Beli Grosir Murah",
    description: "Diskon hingga 25% untuk pembelian dalam jumlah besar (min. 50 pcs)",
    badge: "Grosir",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2D2D] mb-4">Daftar Harga</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Harga yang transparan dan kompetitif dengan kualitas terjamin. Dapatkan berbagai promo menarik untuk
            kebutuhan alat tulis Anda.
          </p>
        </div>

        {/* Pricing Tables */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {pricingData.map((category, index) => (
            <Card key={index} className="border-none shadow-lg bg-white">
              <CardHeader className="bg-[#2D2D2D] text-white text-center rounded-t-lg">
                <CardTitle className="text-xl">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {category.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center">
                      <span className="text-gray-700">{item.service}</span>
                      <span className="font-semibold text-[#00C559]">
                        {item.price}
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Promo Section */}
        <div className="bg-gradient-to-r from-[#00C559] to-[#2D2D2D] rounded-2xl p-8 text-white mb-8">
          <h3 className="text-2xl font-bold text-center mb-8">Promo Spesial</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {promos.map((promo, index) => (
              <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
                <Badge className="mb-3 bg-white text-[#2D2D2D]">{promo.badge}</Badge>
                <h4 className="font-semibold text-lg mb-2">{promo.title}</h4>
                <p className="text-sm opacity-90">{promo.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-xl font-semibold text-center mb-6 text-[#2D2D2D]">Keuntungan Berbelanja di Toko Agung</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Garansi produk original",
              "Harga terjangkau untuk semua kalangan",
              "Stok lengkap dan selalu tersedia",
              "Pelayanan ramah dan profesional",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-[#00C559] flex-shrink-0" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
