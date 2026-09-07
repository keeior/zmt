import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const TRANSLATE_URL = `${
  process.env.SHONA_VOICE_PIPELINE_URL ??
  "https://justice-keeper24--shona-unified-voice-pipeline-fastapi-app.modal.run/v1"
}/translate`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Translation request failed" },
      { status: 500 }
    )
  }
}
