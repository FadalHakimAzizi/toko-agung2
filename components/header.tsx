"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Phone, MessageCircle, Clock, MapPin, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

const navigationItems = [
  { name: "Beranda", href: "#hero" },
  { name: "Tentang", href: "#about" },
  {
    name: "Produk",
    href: "#services",
    submenu: [
      { name: "Alat Tulis Dasar", href: "#services" },
      { name: "Buku & Kertas", href: "#services" },
      { name: "Perlengkapan Sekolah", href: "#services" },
      { name: "Alat Gambar", href: "#services" },
      { name: "Perlengkapan Kantor", href: "#services" },
      { name: "Aksesoris", href: "#services" },
    ],
  },
  { name: "Harga", href: "#pricing" },
  { name: "Katalog", href: "#katalog" },
  { name: "Lokasi", href: "#location" },
  { name: "Galeri", href: "#gallery" },
  { name: "FAQ", href: "#faq" },
  { name: "Kontak", href: "#contact" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  const openWhatsApp = () => {
    const message = "Halo Toko Agung! Saya ingin bertanya tentang produk alat tulis Anda."
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, "_blank")
  }

  const callPhone = () => {
    window.open("tel:02112345678", "_blank")
  }

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#2D2D2D] text-white py-2 text-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Buka: Sen-Jum 06:00-21:00 | Sabtu 06:00-21:00 | Minggu 06:00-21:00</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Jl. Syekh Bayanillah No.609, Setu Wetan</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 px-3"
                  onClick={openWhatsApp}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8 px-3" onClick={callPhone}>
                  <Phone className="h-4 w-4 mr-1" />
                  Telepon
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b" : "bg-white shadow-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="#hero"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection("#hero")
              }}
            >
              <Image
                src="/logoTokoAgung.png"
                alt="Toko Agung Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div>
                <span className="text-xl font-bold text-[#2D2D2D]">Toko Agung</span>
                <p className="text-xs text-gray-500 -mt-1">Alat Tulis Terlengkap</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.submenu ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-[#2D2D2D] hover:text-[#00C559] hover:bg-[#00C559]/5 px-4 py-2 font-medium"
                        >
                          {item.name}
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {item.submenu.map((subItem) => (
                          <DropdownMenuItem
                            key={subItem.name}
                            onClick={() => scrollToSection(subItem.href)}
                            className="cursor-pointer hover:bg-[#00C559]/5 text-[#2D2D2D]"
                          >
                            {subItem.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-[#2D2D2D] hover:text-[#00C559] hover:bg-[#00C559]/5 px-4 py-2 font-medium"
                      onClick={() => scrollToSection(item.href)}
                    >
                      {item.name}
                    </Button>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-[#00C559] text-[#00C559] hover:bg-[#00C559]/5 bg-transparent"
                onClick={() => scrollToSection("#katalog")}
              >
                Lihat Katalog
              </Button>
              <Button
                size="sm"
                className="bg-[#00C559] hover:bg-[#00A047] text-white"
                onClick={() => (window.location.href = "/login")}
              >
                Login Admin
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-[#2D2D2D]">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/logoTokoAgung.png"
                        alt="Toko Agung Logo"
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                      <div>
                        <span className="font-bold text-[#2D2D2D]">Toko Agung</span>
                        <p className="text-xs text-gray-500">Alat Tulis Terlengkap</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 py-6">
                    <div className="space-y-1 px-6">
                      {navigationItems.map((item) => (
                        <div key={item.name}>
                          {item.submenu ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[#2D2D2D] py-2 px-3 bg-[#00C559]/5 rounded-lg">
                                {item.name}
                              </div>
                              <div className="ml-4 space-y-1">
                                {item.submenu.map((subItem) => (
                                  <Button
                                    key={subItem.name}
                                    variant="ghost"
                                    className="w-full justify-start text-gray-600 hover:text-[#00C559] hover:bg-[#00C559]/5 py-2 px-3"
                                    onClick={() => scrollToSection(subItem.href)}
                                  >
                                    {subItem.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-[#2D2D2D] hover:text-[#00C559] hover:bg-[#00C559]/5 py-3 px-3 font-medium"
                              onClick={() => scrollToSection(item.href)}
                            >
                              {item.name}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </nav>

                  {/* Mobile Contact Info */}
                  <div className="border-t p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-[#2D2D2D]">Kontak Cepat</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>0812-3456-7890</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Jl. Syekh Bayanillah</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-[#00C559] hover:bg-[#00A047]" onClick={openWhatsApp}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent border-[#00C559] text-[#00C559]"
                        onClick={callPhone}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Telepon
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
