"use client"

// Widget chatbot RAG: tombol mengambang di kiri bawah (WhatsApp ada di kanan
// bawah) yang membuka panel percakapan. Bisa dipakai pengunjung tanpa login;
// admin mendapat fitur tambahan ringkasan laporan.
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Send, X } from "lucide-react"

interface ChatMessage {
  role: "user" | "bot"
  text: string
}

const SAPAAN =
  "Halo! Saya asisten virtual Toko Alat Tulis Agung. Silakan tanya seputar stok, harga produk, jam buka, alamat, atau cara pembayaran. 😊"

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "bot", text: SAPAAN }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    // Kirim beberapa giliran percakapan terakhir supaya pertanyaan lanjutan
    // (mis. "berapa harganya?") tetap dipahami dalam konteks topik sebelumnya.
    const history = messages.slice(-6)

    setMessages((prev) => [...prev, { role: "user", text: question }])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      })
      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.ok ? data.answer : data.message || "Maaf, terjadi kesalahan. Coba lagi ya.",
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Maaf, saya tidak dapat terhubung ke server. Coba beberapa saat lagi." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Panel percakapan */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="bg-[#00C559] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm leading-tight">Asisten Toko Agung</p>
                <p className="text-xs text-white/80">Tanya stok, harga, & info toko</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
              <span className="sr-only">Tutup chatbot</span>
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#00C559] text-white rounded-br-sm"
                      : "bg-white border text-[#2D2D2D] rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-400 shadow-sm">
                  Sedang mengetik...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t bg-white p-2 flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan..."
              maxLength={500}
              className="flex-1 border-gray-200"
            />
            <Button
              type="submit"
              size="icon"
              className="bg-[#00C559] hover:bg-[#00A047] shrink-0"
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Kirim</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tombol mengambang */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#00C559] hover:bg-[#00A047] text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Buka chatbot Toko Agung"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  )
}
