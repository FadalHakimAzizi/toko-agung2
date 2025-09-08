import Link from "next/link"
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-[#2D2D2D] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logoTokoAgung.png" alt="Logo Toko Agung" width={40} height={40} />
              <div>
                <span className="text-xl font-bold">Toko Agung</span>
                <p className="text-sm text-gray-400 -mt-1">Alat Tulis Terlengkap</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Menyediakan perlengkapan tulis dan kantor lengkap sejak 2010. Aman, nyaman, dan terpercaya.
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="#"
                className="w-8 h-8 bg-[#00C559] rounded-full flex items-center justify-center hover:bg-[#00A047] transition"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-[#00C559] rounded-full flex items-center justify-center hover:bg-[#00A047] transition"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-[#00C559] rounded-full flex items-center justify-center hover:bg-[#00A047] transition"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Layanan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Produk & Layanan</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#services" className="hover:text-white">Alat Tulis Dasar</Link></li>
              <li><Link href="#services" className="hover:text-white">Buku & Kertas</Link></li>
              <li><Link href="#services" className="hover:text-white">Perlengkapan Sekolah</Link></li>
              <li><Link href="#services" className="hover:text-white">Alat Gambar</Link></li>
              <li><Link href="#services" className="hover:text-white">Perlengkapan Kantor</Link></li>
              <li><Link href="#services" className="hover:text-white">Aksesoris</Link></li>
            </ul>
          </div>

          {/* Navigasi */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Menu Cepat</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#about" className="hover:text-white">Tentang Kami</Link></li>
              <li><Link href="#pricing" className="hover:text-white">Harga</Link></li>
              <li><Link href="#upload" className="hover:text-white">Katalog</Link></li>
              <li><Link href="#location" className="hover:text-white">Lokasi</Link></li>
              <li><Link href="#gallery" className="hover:text-white">Galeri</Link></li>
              <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="#contact" className="hover:text-white">Kontak</Link></li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kontak</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Jl. Syekh Bayanillah No.609, Setu Wetan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>021-12345678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@tokoagung.com</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5" />
                <div>
                  <div>Sen-Jum: 06:00 - 21:00</div>
                  <div>Sabtu: 06:00 - 21:00</div>
                  <div>Minggu: 06:00 - 21:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2024 Toko Agung. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white">Kebijakan Privasi</Link>
              <Link href="#" className="hover:text-white">Syarat & Ketentuan</Link>
              <Link href="#" className="hover:text-white">Peta Situs</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
