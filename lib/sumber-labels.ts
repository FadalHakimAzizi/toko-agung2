// Label ramah untuk tiap jenis "sumber" retrieval RAG (nilai mentah yang
// dihasilkan lib/rag.ts, mis. "database produk (pencarian semantic)").
// Dipakai di widget chatbot (client) dan dashboard riwayat chatbot (admin)
// untuk menampilkan "citation" di bawah jawaban — supaya kelihatan jelas
// jawabannya diambil dari data toko sungguhan, ciri khas RAG.
//
// Sengaja dipisah dari lib/rag.ts (bukan cuma di-export dari sana) karena
// lib/rag.ts mengimpor lib/db.ts (memakai `pg`, library koneksi PostgreSQL
// yang hanya jalan di server) — kalau komponen client mengimpor dari
// lib/rag.ts, bundler akan ikut menyeret `pg` ke bundle browser.
const SOURCE_LABELS: Record<string, string> = {
  "database produk": "Stok & harga real-time",
  "database produk (pencarian semantic)": "Stok & harga (pencarian semantic)",
  "database produk (lanjutan topik sebelumnya)": "Stok & harga (lanjutan topik)",
  "knowledge base (semantic)": "Basis pengetahuan toko",
  "knowledge base": "Basis pengetahuan toko",
  "laporan admin": "Laporan real-time",
}

export function formatSumberLabels(raw: string | null | undefined): string[] {
  if (!raw) return []
  const labels = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => SOURCE_LABELS[s] ?? s)
  return Array.from(new Set(labels))
}
