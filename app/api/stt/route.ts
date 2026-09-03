import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const STT_URL = `${
  process.env.STT_BASE_URL ??
  process.env.SHONA_VOICE_PIPELINE_URL ??
  "https://liveforever2022unlimited--shona-unified-voice-pipeline-f-fbb20d.modal.run/v1"
}/audio/transcriptions`

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const res = await fetch(STT_URL, { method: "POST", body: formData })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
