"use client"

import { Button } from "@/components/ui/button"
import { Phone, MapPin, Clock, ShoppingBag } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative bg-gradient-to-br from-[#2D2D2D] via-[#00C559] to-[#2D2D2D] text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="text-[#00C559]">Toko</span> Agung
                <br />
                <span className="text-2xl lg:text-3xl font-medium">Alat Tulis Terlengkap</span>
              </h1>
              <p className="text-xl lg:text-2xl text-green-100 font-medium">Lengkap, Murah, dan Berkualitas!</p>
              <p className="text-lg text-green-200 max-w-lg">
                Menyediakan berbagai kebutuhan alat tulis sekolah, kantor, dan perlengkapan belajar dengan harga
                terjangkau. Dekat sekolah dan mudah dijangkau.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-[#00C559] hover:bg-white hover:text-[#2D2D2D] text-white font-semibold px-8 py-3"
                onClick={() => window.open("https://wa.me/6281234567890", "_blank")}
              >
                <Phone className="mr-2 h-5 w-5" />
                Hubungi Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#2D2D2D] px-8 py-3 bg-transparent"
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Lihat Produk
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center gap-2 text-green-100">
                <MapPin className="h-5 w-5 text-[#00C559]" />
                <span className="text-sm">Jl. Syekh Bayanillah No.609</span>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <Clock className="h-5 w-5 text-[#00C559]" />
                <span className="text-sm">06:00 - 21:00</span>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <Phone className="h-5 w-5 text-[#00C559]" />
                <span className="text-sm">0812-3456-7890</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center relative">
            <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <Image
                src="/dark_logo_agung-removebg-preview.png"
                alt="Toko alat tulis dengan berbagai produk"
                width={500}
                height={400}
                className="rounded-lg shadow-2xl"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#00C559]/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
