import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PenTool, BookOpen, Ruler, Palette, Briefcase, Gift } from "lucide-react"

const services = [
  {
    icon: PenTool,
    title: "Alat Tulis Dasar",
    description: "Pulpen, pensil, spidol, penghapus, tip-ex, dan berbagai alat tulis harian untuk sekolah dan kantor.",
    features: ["Pulpen berbagai warna", "Pensil 2B, HB, 2H", "Spidol permanen & whiteboard"],
  },
  {
    icon: BookOpen,
    title: "Buku & Kertas",
    description:
      "Buku tulis, buku gambar, kertas HVS, kertas buffalo, dan berbagai jenis kertas untuk kebutuhan belajar.",
    features: ["Buku tulis 38-100 lembar", "Kertas HVS A4, F4, A3", "Buku gambar & sketsa"],
  },
  {
    icon: Ruler,
    title: "Perlengkapan Sekolah",
    description: "Penggaris, jangka, busur, kalkulator, dan perlengkapan matematika serta geometri lainnya.",
    features: ["Penggaris 15cm, 30cm", "Set jangka lengkap", "Kalkulator scientific"],
  },
  {
    icon: Palette,
    title: "Alat Gambar & Seni",
    description: "Crayon, cat air, kuas, pensil warna, dan perlengkapan seni untuk mengembangkan kreativitas.",
    features: ["Pensil warna 12-48 warna", "Cat air & kuas", "Crayon & oil pastel"],
  },
  {
    icon: Briefcase,
    title: "Perlengkapan Kantor",
    description: "Stapler, paper clip, amplop, map, dan berbagai kebutuhan administrasi kantor dan sekolah.",
    features: ["Stapler & isi staples", "Map plastik & karton", "Amplop berbagai ukuran"],
  },
  {
    icon: Gift,
    title: "Aksesoris & Lainnya",
    description: "Tas sekolah, tempat pensil, label, stiker, dan berbagai aksesoris menarik untuk anak-anak.",
    features: ["Tempat pensil karakter", "Stiker & label nama", "Tas sekolah & ransel"],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2D2D] mb-4">Produk Kami</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kami menyediakan berbagai kebutuhan alat tulis dan perlengkapan sekolah dengan kualitas terbaik dan harga
            yang terjangkau untuk semua kalangan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white group hover:bg-[#00C559]/5"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#00C559]/10 group-hover:bg-[#00C559]/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <service.icon className="h-8 w-8 text-[#00C559]" />
                </div>
                <CardTitle className="text-xl text-[#2D2D2D]">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-[#00C559] rounded-full"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
