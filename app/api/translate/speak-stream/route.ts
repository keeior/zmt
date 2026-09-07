import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // seconds — raise serverless execution limit for model cold-starts

const SPEAK_STREAM_URL = `${
  process.env.SHONA_VOICE_PIPELINE_URL ??
  "https://justice-keeper24--shona-unified-voice-pipeline-fastapi-app.modal.run/v1"
}/translate/speak-stream`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(SPEAK_STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) {
      const err = await res.text()
      console.error("[speak-stream] upstream error:", res.status, err)
      return new Response(JSON.stringify({ error: err }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // stops reverse proxies from buffering SSE
      },
    })
  } catch (error: any) {
    console.error("[speak-stream] fetch threw:", error)
    return new Response(
      JSON.stringify({ error: error?.message || "Speak stream request failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}
