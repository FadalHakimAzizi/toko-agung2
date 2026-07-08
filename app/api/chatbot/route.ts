// POST /api/chatbot — endpoint chatbot RAG.
// Body: { message: "pertanyaan user" } → { answer, sumber }
// Alur: sanitasi input → retrieval konteks (database + knowledge base)
// → generation (LLM jika dikonfigurasi, fallback template) → simpan log.
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { isRateLimited, getClientIp } from "@/lib/rate-limit"
import {
  sanitizeQuestion,
  retrieveContext,
  buildContextText,
  buildTemplateAnswer,
  generateLlmAnswer,
  isGreetingOnly,
  GREETING_MESSAGE,
  REFUSAL_MESSAGE,
  type ChatHistoryItem,
} from "@/lib/rag"

const CHATBOT_RATE_LIMIT = 20 // pertanyaan
const CHATBOT_RATE_WINDOW_MS = 60_000 // per menit
const HISTORY_TURNS = 6 // giliran percakapan terakhir yang disertakan sebagai konteks

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = sanitizeQuestion(body.message)

    if (!question) {
      return NextResponse.json({ message: "Pertanyaan tidak boleh kosong" }, { status: 400 })
    }

    // Riwayat percakapan (opsional) dari client, dipakai supaya pertanyaan
    // lanjutan (mis. "berapa harganya?") tetap nyambung dengan topik sebelumnya.
    const rawHistory: unknown[] = Array.isArray(body.history) ? body.history : []
    const history: ChatHistoryItem[] = rawHistory
      .slice(-HISTORY_TURNS)
      .map((h): ChatHistoryItem | null => {
        if (typeof h !== "object" || h === null) return null
        const role = (h as Record<string, unknown>).role === "user" ? "user" : "bot"
        const text = sanitizeQuestion((h as Record<string, unknown>).text)
        return text ? { role, text } : null
      })
      .filter((h): h is ChatHistoryItem => h !== null)
    const lastUserQuestion = [...history].reverse().find((h) => h.role === "user")?.text ?? ""

    // Chatbot bisa dipakai tanpa login; fitur laporan hanya untuk admin
    const user = await getCurrentUser()
    const isAdmin = user?.role === "admin"

    // Batasi jumlah pertanyaan per user/IP agar kuota API LLM & embedding
    // tidak habis disalahgunakan (spam request).
    const rateKey = user ? `user:${user.id}` : `ip:${getClientIp(request)}`
    if (isRateLimited(rateKey, CHATBOT_RATE_LIMIT, CHATBOT_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { message: "Terlalu banyak pertanyaan dalam waktu singkat. Coba lagi sebentar lagi." },
        { status: 429 },
      )
    }

    // Sapaan singkat ("hai", "halo", dst.) tanpa pertanyaan lain — balas
    // sapaan ramah langsung tanpa perlu retrieval/LLM.
    if (isGreetingOnly(question)) {
      await query(
        "INSERT INTO chatbot_logs (user_id, pertanyaan, jawaban, sumber) VALUES ($1, $2, $3, $4)",
        [user?.id ?? null, question, GREETING_MESSAGE, "sapaan"],
      )
      return NextResponse.json({ answer: GREETING_MESSAGE, sumber: null })
    }

    // 1) Retrieval (dengan fallback ke topik pertanyaan sebelumnya jika perlu)
    const ctx = await retrieveContext(question, isAdmin, lastUserQuestion)
    const contextText = buildContextText(ctx)

    // 2) Generation: jawaban template selalu disiapkan sebagai dasar/fallback
    const templateAnswer = buildTemplateAnswer(question, ctx)
    let answer = templateAnswer
    // LLM dipanggil jika ada konteks relevan, ATAU ada riwayat percakapan
    // (supaya pertanyaan lanjutan tetap bisa dijawab lewat konteks obrolan
    // meski retrieval turn ini sendiri tidak menemukan apa-apa).
    if (templateAnswer !== REFUSAL_MESSAGE || lastUserQuestion) {
      const llmAnswer = await generateLlmAnswer(question, contextText, history)
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
