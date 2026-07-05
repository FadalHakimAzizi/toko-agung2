// POST /api/chatbot — endpoint chatbot RAG.
// Body: { message: "pertanyaan user" } → { answer, sumber }
// Alur: sanitasi input → retrieval konteks (database + knowledge base)
// → generation (LLM jika dikonfigurasi, fallback template) → simpan log.
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import {
  sanitizeQuestion,
  retrieveContext,
  buildContextText,
  buildTemplateAnswer,
  generateLlmAnswer,
  REFUSAL_MESSAGE,
} from "@/lib/rag"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = sanitizeQuestion(body.message)

    if (!question) {
      return NextResponse.json({ message: "Pertanyaan tidak boleh kosong" }, { status: 400 })
    }

    // Chatbot bisa dipakai tanpa login; fitur laporan hanya untuk admin
    const user = await getCurrentUser()
    const isAdmin = user?.role === "admin"

    // 1) Retrieval
    const ctx = await retrieveContext(question, isAdmin)
    const contextText = buildContextText(ctx)

    // 2) Generation: jawaban template selalu disiapkan sebagai dasar/fallback
    const templateAnswer = buildTemplateAnswer(question, ctx)
    let answer = templateAnswer
    // LLM hanya dipanggil jika ada konteks relevan; tanpa konteks tetap menolak
    if (templateAnswer !== REFUSAL_MESSAGE) {
      const llmAnswer = await generateLlmAnswer(question, contextText)
      if (llmAnswer) answer = llmAnswer
    }

    const sumber = ctx.sumber.length > 0 ? ctx.sumber.join(", ") : null

    // 3) Simpan riwayat percakapan
    await query(
      "INSERT INTO chatbot_logs (user_id, pertanyaan, jawaban, sumber) VALUES ($1, $2, $3, $4)",
      [user?.id ?? null, question, answer, sumber],
    )

    return NextResponse.json({ answer, sumber })
  } catch (err) {
    console.error("Chatbot error:", err)
    return NextResponse.json(
      { message: "Chatbot sedang tidak dapat menjawab. Coba beberapa saat lagi." },
      { status: 500 },
    )
  }
}
