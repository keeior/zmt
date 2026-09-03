import type { SupportedLanguage } from "./zimtour-store"
import { toNllbCode } from "./nllbLangCodes"

/**
 * Modular Shona STT (whisper-small-shona) & TTS (sna-f5-tts) & Puter.js TTS Router
 * Calls go through Next.js API routes (/api/stt, /api/tts) to avoid CORS.
 */

const STT_URL = "/api/stt"
const TTS_URL = "/api/tts"


// ── WebM → WAV conversion (libsndfile on server can't read webm) ──

async function webmToWav(webmBlob: Blob): Promise<Blob> {
  const ctx = new AudioContext({ sampleRate: 16000 })
  try {
    const arrayBuf = await webmBlob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(arrayBuf)
    const pcm = decoded.getChannelData(0) // mono
    const wav = encodeWav(pcm, decoded.sampleRate)
    return new Blob([wav], { type: "audio/wav" })
  } finally {
    ctx.close()
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buf)
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }

  writeStr(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, "WAVE")
  writeStr(12, "fmt ")
  view.setUint32(16, 16, true)        // subchunk size
  view.setUint16(20, 1, true)         // PCM
  view.setUint16(22, 1, true)         // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true)         // block align
  view.setUint16(34, 16, true)        // bits per sample
  writeStr(36, "data")
  view.setUint32(40, samples.length * 2, true)

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
  return buf
}

// ── Speech-to-Text (Shona Whisper) ──

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Convert webm → wav so libsndfile on server can parse it
  const wavBlob = await webmToWav(audioBlob)

  const form = new FormData()
  form.append("file", wavBlob, "recording.wav")
  form.append("model", "whisper-small-shona")
  form.append("language", "sn")

  const res = await fetch(STT_URL, { method: "POST", body: form })

  if (!res.ok) throw new Error(`STT ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.text || ""
}

// ── Text-to-Speech (Shona F5-TTS) ──

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sna-f5-tts",
      input: text,
      voice: "default",
      response_format: "mp3",
    }),
  })

  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`)
  return res.arrayBuffer()
}

/** Play an ArrayBuffer as audio, returns cleanup fn */
export function playAudioBuffer(buffer: ArrayBuffer, onEnded?: () => void): () => void {
  const blob = new Blob([buffer], { type: "audio/mpeg" })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  if (onEnded) audio.onended = onEnded
  audio.play().catch((e) => console.warn("Audio playback interrupted:", e))
  return () => {
    audio.pause()
    URL.revokeObjectURL(url)
  }
}

// ── Puter.js TTS Engine Integration ──

export async function speakPuterTTS(text: string, lang: string, onEnded?: () => void): Promise<() => void> {
  try {
    const puterModule = await import("@heyputer/puter.js")
    const puter = puterModule.default || puterModule.puter
    if (puter && puter.ai && typeof puter.ai.txt2speech === "function") {
      const audio = await puter.ai.txt2speech(text, lang)
      if (audio && typeof audio.play === "function") {
        if (onEnded) audio.onended = onEnded
        audio.play().catch((err) => console.warn("Puter audio play interrupted:", err))
        return () => {
          try { audio.pause() } catch {}
        }
      }
    }
  } catch (err) {
    console.warn("Puter TTS call failed, falling back to browser SpeechSynthesis:", err)
  }

  // Fallback to browser SpeechSynthesis
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === "spanish" ? "es-ES" : lang === "english" ? "en-US" : "en-US"
    if (onEnded) utterance.onend = onEnded
    window.speechSynthesis.speak(utterance)
    return () => window.speechSynthesis.cancel()
  }

  return () => {}
}

/** Dynamic TTS Router: Calls Modal Shona F5-TTS ONLY if language is 'shona', else uses Puter.js TTS */
export async function speakTextByLanguage(
  text: string,
  language: SupportedLanguage = "shona",
  onEnded?: () => void
): Promise<() => void> {
  if (language === "shona") {
    try {
      const buffer = await synthesizeSpeech(text)
      return playAudioBuffer(buffer, onEnded)
    } catch (err) {
      console.warn("Shona F5-TTS synthesis error, falling back to Puter/Browser:", err)
      return speakPuterTTS(text, "shona", onEnded)
    }
  } else {
    // Non-Shona: Do NOT call Shona TTS! Use Puter.js with language or 'auto' if other
    const puterLang = language === "other" ? "auto" : language
    return speakPuterTTS(text, puterLang, onEnded)
  }
}

// ── Mic Recorder (MediaRecorder → Blob) ──

export type RecorderHandle = {
  stop: () => Promise<Blob>
  cancel: () => void
}

export function startMicRecording(): Promise<RecorderHandle> {
  return navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.start(250)

    return {
      stop: () =>
        new Promise<Blob>((resolve) => {
          recorder.onstop = () => {
            stream.getTracks().forEach((t) => t.stop())
            resolve(new Blob(chunks, { type: "audio/webm" }))
          }
          recorder.stop()
        }),
      cancel: () => {
        recorder.stop()
        stream.getTracks().forEach((t) => t.stop())
      },
    }
  })
}

// ── NLLB Language Code Helper ──

export function toNllbLangCode(code: string): string {
  return toNllbCode(code)
}


// ── Modal NLLB Translation API ──

export async function translateText(
  text: string,
  sourceLang = "en",
  targetLang = "sn"
): Promise<string> {
  const src = toNllbLangCode(sourceLang)
  const tgt = toNllbLangCode(targetLang)

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source_lang: src,
      target_lang: tgt,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Translation ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data.translated_text || data.text || ""
}

// ── Web Audio Gapless Speech Player ──

export class GaplessSpeechPlayer {
  private audioContext: AudioContext | null = null
  private nextStartTime = 0
  private queue: Promise<void> = Promise.resolve()
  private activeSources: AudioBufferSourceNode[] = []
  private isStopped = false
  private pendingCount = 0
  private onAllDone: (() => void) | null = null

  setOnAllDone(cb: () => void) {
    this.onAllDone = cb
  }

  private getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioCtx()
    }
    return this.audioContext
  }

  /** Prime/unlock AudioContext during a real user gesture event (click, toggle, touch) */
  async primeFromGesture(): Promise<void> {
    try {
      const ctx = this.getContext()
      if (ctx.state === "suspended") {
        await ctx.resume()
      }
      console.log("[GaplessSpeechPlayer] AudioContext state after gesture prime:", ctx.state)
    } catch (err) {
      console.warn("[GaplessSpeechPlayer] Failed to prime AudioContext:", err)
    }
  }

  /** Call synchronously inside user gesture click handler to guarantee AudioContext activation */
  ensureContextResumed() {
    try {
      const ctx = this.getContext()
      if (ctx.state === "suspended") {
        ctx.resume().catch((err) => console.warn("[GaplessSpeechPlayer] AudioContext resume failed:", err))
      }
    } catch (err) {
      console.warn("[GaplessSpeechPlayer] AudioContext initialization failed:", err)
    }
  }

  async resume() {
    this.ensureContextResumed()
  }

  reset() {
    this.stopAll()
    this.isStopped = false
    this.pendingCount = 0
    this.ensureContextResumed()
    const ctx = this.getContext()
    this.nextStartTime = ctx.currentTime
    this.queue = Promise.resolve()
  }

  stopAll() {
    this.isStopped = true
    this.pendingCount = 0
    for (const src of this.activeSources) {
      try {
        src.stop()
        src.disconnect()
      } catch {}
    }
    this.activeSources = []
  }

  enqueueBase64Mp3(base64: string) {
    if (this.isStopped) return
    this.pendingCount++
    this.queue = this.queue.then(() => this._decodeAndSchedule(base64))
  }

  private async _decodeAndSchedule(base64: string) {
    if (this.isStopped) return
    try {
      const ctx = this.getContext()
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      // decodeAudioData consumes array buffer, so pass a copy
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0))
      if (this.isStopped) return

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)

      const startAt = Math.max(this.nextStartTime, ctx.currentTime)
      source.start(startAt)
      this.activeSources.push(source)

      source.onended = () => {
        const idx = this.activeSources.indexOf(source)
        if (idx !== -1) this.activeSources.splice(idx, 1)
      }

      this.nextStartTime = startAt + audioBuffer.duration
    } catch (err) {
      console.error("[GaplessSpeechPlayer] Failed to decode/play audio chunk:", err)
    } finally {
      this.pendingCount--
      if (this.pendingCount === 0 && !this.isStopped) {
        this.onAllDone?.()
      }
    }
  }

  async waitForEnd(): Promise<void> {
    await this.queue
    if (this.isStopped || !this.audioContext) return
    const remainingMs = Math.max(0, (this.nextStartTime - this.audioContext.currentTime) * 1000)
    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs))
    }
  }
}


// Module-level shared singleton speech player (survives HMR in dev via window.__shonaSpeechPlayer)
let globalSpeechPlayer: GaplessSpeechPlayer | null = null

export function getSharedSpeechPlayer(): GaplessSpeechPlayer {
  if (typeof window === "undefined") {
    return new GaplessSpeechPlayer()
  }
  const w = window as any
  if (process.env.NODE_ENV !== "production") {
    if (!w.__shonaSpeechPlayer) {
      w.__shonaSpeechPlayer = new GaplessSpeechPlayer()
    }
    return w.__shonaSpeechPlayer
  }
  if (!globalSpeechPlayer) {
    globalSpeechPlayer = new GaplessSpeechPlayer()
  }
  return globalSpeechPlayer
}


// ── SSE Sentence-Streamed Translate + Gapless Speak ──

export async function speakTranslatedGapless(
  text: string,
  opts: {
    sourceLang?: string
    targetLang?: string
    onTranslation?: (translation: string) => void
    onAudioChunk?: () => void
    onError?: (err: Error) => void
    onComplete?: () => void
  } = {}
): Promise<{ player: GaplessSpeechPlayer; stop: () => void }> {
  const player = getSharedSpeechPlayer()
  // CRITICAL: Ensure AudioContext activation
  player.ensureContextResumed()
  player.reset()
  player.setOnAllDone(() => opts.onComplete?.())


  let isCancelled = false
  const stop = () => {
    isCancelled = true
    player.stopAll()
  }

  const srcLang = toNllbCode(opts.sourceLang ?? "en")
  const tgtLang = toNllbCode(opts.targetLang ?? "sn")

  const res = await fetch("/api/translate/speak-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source_lang: srcLang,
      target_lang: tgtLang,
    }),
  })

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "Speak stream failed")
    const err = new Error(errText)
    opts.onError?.(err)
    throw err
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  // Stream reading loop
  ;(async () => {
    try {
      while (!isCancelled) {
        const { done, value } = await reader.read()
        if (done || isCancelled) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""

        for (const part of parts) {
          if (isCancelled) break
          const trimmed = part.trim()
          if (!trimmed.startsWith("data: ")) continue

          try {
            const event = JSON.parse(trimmed.slice(6))
            if (event.type === "translation") {
              opts.onTranslation?.(event.text)
            } else if (event.type === "audio_chunk") {
              console.log("[SSE] audio_chunk received, index:", event.index, "bytes(b64):", event.data?.length, "enqueueFn:", typeof player.enqueueBase64Mp3)
              player.enqueueBase64Mp3(event.data)
              opts.onAudioChunk?.()
            }


          } catch (err) {
            console.warn("Failed parsing SSE chunk:", err, trimmed)
          }
        }
      }
    } catch (err: any) {
      if (!isCancelled) {
        console.error("Error reading speak-stream:", err)
        opts.onError?.(err)
      }
    }
  })()

  return { player, stop }
}

