"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const products = [
  {
    category: "Alat Tulis Dasar",
    items: [
      { name: "Pulpen berbagai warna", price: "Rp3.000 - Rp5.000", img: "/4.jpg", desc: "Pulpen warna-warni untuk sekolah & kantor." },
      { name: "Pensil 2B, HB, 2H", price: "Rp2.000 - Rp4.000", img: "/1.webp", desc: "Pensil berkualitas untuk menulis & menggambar." },
      { name: "Spidol permanen & whiteboard", price: "Rp6.000 - Rp12.000", img: "/5.png", desc: "Spidol untuk papan tulis & kebutuhan harian." },
      { name: "Penghapus & Tip-Ex", price: "Rp2.000 - Rp8.000", img: "/2.jpg", desc: "Alat penghapus praktis & cepat bersih." }
    ]
  },
  {
    category: "Buku & Kertas",
    items: [
      { name: "Buku tulis 38-100 lembar", price: "Rp5.000 - Rp15.000", img: "/7.jpg", desc: "Buku tulis untuk sekolah & kuliah." },
      { name: "Kertas HVS A4, F4, A3", price: "Rp25.000 - Rp55.000/pack", img: "/8.webp", desc: "Kertas serbaguna untuk cetak & tulis." },
      { name: "Buku gambar & sketsa", price: "Rp10.000 - Rp25.000", img: "/7.jpg", desc: "Buku untuk seni & kreativitas anak." }
    ]
  },
  {
    category: "Perlengkapan Sekolah",
    items: [
      { name: "Penggaris 15cm, 30cm", price: "Rp3.000 - Rp7.000", img: "/9.jpeg", desc: "Penggaris plastik & besi berbagai ukuran." },
      { name: "Set jangka lengkap", price: "Rp15.000 - Rp30.000", img: "/10.jpeg", desc: "Set jangka untuk pelajaran matematika." },
      { name: "Kalkulator scientific", price: "Rp120.000 - Rp250.000", img: "/11.jpeg", desc: "Kalkulator untuk kebutuhan sekolah & kantor." }
    ]
  },
  {
    category: "Alat Gambar & Seni",
    items: [
      { name: "Pensil warna 12-48 warna", price: "Rp20.000 - Rp85.000", img: "/4.jpg", desc: "Set pensil warna untuk menggambar." },
      { name: "Cat air & kuas", price: "Rp30.000 - Rp70.000", img: "/12.jpeg", desc: "Cat air untuk anak & pelukis pemula." },
      { name: "Crayon & oil pastel", price: "Rp25.000 - Rp60.000", img: "/12.jpeg", desc: "Crayon dan pastel dengan warna cerah." }
    ]
  },
  {
    category: "Perlengkapan Kantor",
    items: [
      { name: "Stapler & isi staples", price: "Rp15.000 - Rp40.000", img: "/13.jpeg", desc: "Stapler kuat dengan isi cadangan." },
      { name: "Map plastik & karton", price: "Rp3.000 - Rp10.000", img: "/14.jpeg", desc: "Map berbagai ukuran untuk dokumen." },
      { name: "Amplop berbagai ukuran", price: "Rp2.000 - Rp7.000", img: "/15.jpeg", desc: "Amplop cokelat & putih untuk surat." }
    ]
  },
  {
    category: "Aksesoris & Lainnya",
    items: [
      { name: "Tempat pensil karakter", price: "Rp20.000 - Rp45.000", img: "/16.jpeg", desc: "Tempat pensil lucu & praktis." },
      { name: "Stiker & label nama", price: "Rp5.000 - Rp15.000", img: "/17.jpeg", desc: "Stiker custom untuk anak & kantor." },
      { name: "Tas sekolah & ransel", price: "Rp100.000 - Rp250.000", img: "/18.jpeg", desc: "Tas kuat & nyaman untuk sekolah." }
    ]
  }
]

export function ShoppingCatalog() {
  return (
    <section id="katalog" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2D2D] mb-4">Katalog Belanja Alat Tulis & Sekolah</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih kebutuhan alat tulis, buku, perlengkapan sekolah, seni, hingga aksesoris favorit Anda.
          </p>
        </div>

        <div className="space-y-16 max-w-7xl mx-auto">
          {products.map((category, idx) => (
            <div key={idx}>
              <h3 className="text-2xl font-semibold text-[#00C559] mb-6">{category.category}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.items.map((item, i) => (
                  <Card key={i} className="border shadow-md rounded-2xl overflow-hidden">
                    <img src={item.img} alt={item.name} className="w-full h-40 object-cover" />
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
                      <p className="font-bold text-[#00C559]">{item.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}