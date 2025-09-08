"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"

export function WhatsAppFloat() {
  const [isVisible, setIsVisible] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    const tooltipTimer = setTimeout(() => {
      setShowTooltip(false)
    }, 8000)

    return () => {
      clearTimeout(timer)
      clearTimeout(tooltipTimer)
    }
  }, [])

  const openWhatsApp = () => {
    const message = "Halo Toko Agung! Saya ingin bertanya tentang produk alat tulis Anda."
    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const closeTooltip = () => {
    setShowTooltip(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 max-w-xs mb-2 animate-bounce">
          <button onClick={closeTooltip} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
          <div className="pr-6">
            <p className="text-sm font-semibold text-[#2D2D2D] mb-1">🛍️ Butuh alat tulis?</p>
            <p className="text-xs text-gray-600">Chat langsung dengan kami untuk info produk dan harga!</p>
          </div>
          <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={openWhatsApp}
        className="bg-[#00C559] hover:bg-[#00A047] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Chat WhatsApp"
      >
        <MessageCircle className="h-6 w-6 group-hover:animate-pulse" />
      </button>

      {/* Ripple Effect */}
      <div className="absolute inset-0 rounded-full bg-[#00C559] animate-ping opacity-20"></div>
    </div>
  )
}
