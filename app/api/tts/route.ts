import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const TTS_URL = `${
  process.env.TTS_BASE_URL ??
  process.env.SHONA_VOICE_PIPELINE_URL ??
  "https://justice-keeper24--shona-unified-voice-pipeline-fastapi-app.modal.run/v1"
}/audio/speech`

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  // Stream the audio bytes back
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg",
    },
  })
}
