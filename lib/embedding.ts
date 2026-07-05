// Embedding hosted untuk RAG semantic retrieval (pgvector).
// Aman untuk deploy karena hanya memanggil API, bukan menjalankan model lokal.
//
// Mendukung dua jenis provider, dipilih otomatis berdasarkan EMBEDDING_BASE_URL:
//   1. Google Gemini  -> endpoint native :embedContent  (base URL mengandung "generativelanguage.googleapis.com")
//   2. OpenAI-compatible /embeddings  (mis. Jina AI, OpenAI) -> selain itu
//
// Dimensi vektor = 768 (harus sama dengan kolom vector(768) di database).
export const EMBEDDING_DIM = 768

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.EMBEDDING_API_KEY
  if (!apiKey) return null

  const model = process.env.EMBEDDING_MODEL || "gemini-embedding-001"
  const baseUrl = (
    process.env.EMBEDDING_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, "")
  const clipped = text.slice(0, 8000)

  try {
    let response: Response
    if (baseUrl.includes("generativelanguage.googleapis.com")) {
      // --- Google Gemini (native embedContent) ---
      response = await fetch(`${baseUrl}/models/${model}:embedContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text: clipped }] },
          outputDimensionality: EMBEDDING_DIM,
        }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) {
        console.error("Embedding error (Gemini):", response.status, await response.text())
        return null
      }
      const data = await response.json()
      const values = data?.embedding?.values
      return Array.isArray(values) ? (values as number[]) : null
    }

    // --- OpenAI-compatible /embeddings (Jina AI, OpenAI, dll.) ---
    response = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: clipped, dimensions: EMBEDDING_DIM }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      console.error("Embedding error (OpenAI-compatible):", response.status, await response.text())
      return null
    }
    const data = await response.json()
    const values = data?.data?.[0]?.embedding
    return Array.isArray(values) ? (values as number[]) : null
  } catch (err) {
    console.error("Embedding request gagal:", err)
    return null
  }
}

// Ubah array angka menjadi literal vektor pgvector, contoh: "[0.1,0.2,0.3]"
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`
}
