"use client"

// Widget chatbot RAG: tombol mengambang di kiri bawah (WhatsApp ada di kanan
// bawah) yang membuka panel percakapan. Bisa dipakai pengunjung tanpa login;
// admin mendapat fitur tambahan ringkasan laporan.
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Database, Send, X } from "lucide-react"

interface ChatMessage {
  role: "user" | "bot"
  text: string
  sumber?: string | null
}

const SAPAAN =
  "Halo! Saya asisten virtual Toko Alat Tulis Agung. Silakan tanya seputar stok, harga produk, jam buka, alamat, atau cara pembayaran. 😊"

// Label ramah untuk tiap jenis sumber retrieval (lihat lib/rag.ts) — ditampilkan
// sebagai "citation" di bawah jawaban bot, supaya terlihat jelas bahwa jawaban
// diambil dari data toko yang sebenarnya (ciri khas RAG), bukan sekadar
// ngobrol bebas seperti chatbot generik.
const SOURCE_LABELS: Record<string, string> = {
  "database produk": "Stok & harga real-time",
  "database produk (lanjutan topik sebelumnya)": "Stok & harga (lanjutan topik)",
  "knowledge base (semantic)": "Basis pengetahuan toko",
  "knowledge base": "Basis pengetahuan toko",
  "laporan admin": "Laporan real-time",
}

function formatSumber(raw: string | null | undefined): string[] {
  if (!raw) return []
  const labels = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => SOURCE_LABELS[s] ?? s)
  return Array.from(new Set(labels))
}

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
          sumber: response.ok ? data.sumber : null,
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
                <p className="text-xs text-white/80">Jawaban berdasarkan data toko real-time</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
              <span className="sr-only">Tutup chatbot</span>
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => {
              const sources = msg.role === "bot" ? formatSumber(msg.sumber) : []
              return (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[#00C559] text-white rounded-br-sm"
                        : "bg-white border text-[#2D2D2D] rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {sources.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 max-w-[85%]">
                      {sources.map((label, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] leading-none text-gray-500 bg-gray-100 border rounded-full px-2 py-1"
                        >
                          <Database className="h-2.5 w-2.5" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
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
