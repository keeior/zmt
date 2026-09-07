// app/api/translate/llm/route.ts
//
// Server-side only. Reads GROQ_API_KEY (NOT the NEXT_PUBLIC_ one -- delete
// that one from .env.local, it has no reason to exist). This route exists
// so the browser never sees the real key: it calls this same-origin route,
// this route calls Groq, the key stays server-side the whole time.

import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured on the server" }, { status: 500 })
  }

  try {
    const { text, sourceLabel, targetLabel } = await req.json()
    if (!text || !sourceLabel || !targetLabel) {
      return NextResponse.json({ error: "Missing text/sourceLabel/targetLabel" }, { status: 422 })
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              `You are a professional translator. Translate the user's text from ${sourceLabel} to ${targetLabel}. ` +
              `Reply with ONLY the translated text -- no quotes, no explanations, no notes, nothing else.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        max_completion_tokens: 512,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: errText }, { status: res.status })
    }

    const data = await res.json()
    const translated = data.choices?.[0]?.message?.content?.trim() || ""
    return NextResponse.json({ text: translated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "LLM translate failed" }, { status: 500 })
  }
}
