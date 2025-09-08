import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Users, Award, Clock } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2D2D] mb-4">Tentang Toko Agung</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Berdiri sejak 2010, Toko Agung telah menjadi pilihan utama siswa, mahasiswa, dan pekerja kantoran untuk
            kebutuhan alat tulis dan perlengkapan sekolah. Dengan lokasi strategis dekat sekolah dan kampus, kami
            berkomitmen menyediakan produk berkualitas dengan harga terjangkau.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-[#00C559]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-[#00C559]" />
              </div>
              <h3 className="font-semibold text-[#2D2D2D] mb-2">Lokasi Strategis</h3>
              <p className="text-gray-600 text-sm">Dekat sekolah, kampus, dan area perkantoran untuk kemudahan akses</p>
            </CardContent>
          </Card>

          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-[#2D2D2D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#2D2D2D]" />
              </div>
              <h3 className="font-semibold text-[#2D2D2D] mb-2">15,000+ Pelanggan</h3>
              <p className="text-gray-600 text-sm">Dipercaya oleh ribuan siswa, mahasiswa, dan pekerja kantoran</p>
            </CardContent>
          </Card>

          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-[#00C559]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-[#00C559]" />
              </div>
              <h3 className="font-semibold text-[#2D2D2D] mb-2">Produk Berkualitas</h3>
              <p className="text-gray-600 text-sm">
                Menjual produk original dari brand ternama dengan garansi kualitas
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-[#2D2D2D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[#2D2D2D]" />
              </div>
              <h3 className="font-semibold text-[#2D2D2D] mb-2">Buka 15 Jam</h3>
              <p className="text-gray-600 text-sm">Melayani dari pagi hingga malam untuk kemudahan berbelanja</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
