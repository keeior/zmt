import { NextRequest, NextResponse } from "next/server"

const STT_URL = `${
  process.env.STT_BASE_URL ??
  "https://liveforever2022unlimited--shona-stt-server-fastapi-app.modal.run/v1"
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
