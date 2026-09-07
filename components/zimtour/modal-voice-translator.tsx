"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { X, ChevronDown, Check, Mic, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { AgentAudioVisualizerBar } from "@/components/agents-ui/agent-audio-visualizer-bar"

const API_ORIGIN =
  process.env.NEXT_PUBLIC_AGENT_ORIGIN ||
  "https://justice-keeper24--shona-unified-voice-pipeline-fastapi-app.modal.run"

// ---------------------------------------------------------------------------
// Languages. `bcp47` drives Web Speech recognition. `nllb` drives your own
// /v1/translate (NLLB-200 codes). `puterLang` is the plain language tag
// Puter's txt2speech options.language expects for non-Shona targets.
// Extend this list freely -- nothing else in the component depends on its length.
// ---------------------------------------------------------------------------
const LANGUAGES = [
  { label: "English", bcp47: "en-US", nllb: "eng_Latn", puterLang: "en-US" },
  { label: "Shona", bcp47: "sn-ZW", nllb: "sna_Latn", puterLang: "sn" },
  { label: "Spanish", bcp47: "es-ES", nllb: "spa_Latn", puterLang: "es-ES" },
  { label: "French", bcp47: "fr-FR", nllb: "fra_Latn", puterLang: "fr-FR" },
  { label: "Portuguese", bcp47: "pt-PT", nllb: "por_Latn", puterLang: "pt-PT" },
  { label: "Swahili", bcp47: "sw-KE", nllb: "swh_Latn", puterLang: "sw" },
  { label: "Zulu", bcp47: "zu-ZA", nllb: "zul_Latn", puterLang: "zu" },
] as const

type Language = (typeof LANGUAGES)[number]

const FALLBACK_VOICES = ["visionary", "bella", "ivvan", "jessica", "laura", "sarah", "tatenda"]

// Same voice name resolves to two different engines depending on target
// language: your own F5-TTS reference clip (Shona) or a real ElevenLabs
// voice ID from your own account (everything else, via Puter's bridge).
// This map IS the "same names across both backends" design.
const ELEVENLABS_VOICE_IDS: Record<string, string> = {
  tatenda: "QYPUpDlGmq6ALy7JTJpA",
  ivvan: "tQ4MEZFJOzsahSEEZtHK",
  visionary: "SK3SOoZLZkXaxcDcOGrV",
  bella: "hpp4J3VqNfWAUOO0d1Us",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  laura: "FGY2WhTYpPnrIDTdsKH5",
  jessica: "cgSgspJ2msm6clMCkdW9",
}

// A very naive sentence splitter -- same tradeoff as the backend's
// punctuation fallback: it'll misfire on abbreviations/decimals, but for
// short spoken utterances that's a rare, low-stakes miss, not broken speech.
function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [text.trim()].filter(Boolean)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Routes through /api/translate/llm (same-origin, server-side) rather than
// calling Groq directly -- keeps the real API key off the client. Used when
// "Use Ltrans" is on, for every language pair, not just the ones NLLB
// struggles with -- simpler to reason about than a per-language mix.
async function translateWithLLM(text: string, sourceLabel: string, targetLabel: string): Promise<string> {
  const res = await fetch("/api/translate/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLabel, targetLabel }),
  })
  if (!res.ok) throw new Error(`LLM translate returned HTTP ${res.status}`)
  const data = await res.json()
  return data.text || ""
}

// Buckets an AnalyserNode's frequency data into `barCount` averaged bands,
// each normalized to roughly 0..1. This is what AgentAudioVisualizerBar's
// `volumeBands` prop actually wants -- one real amplitude per bar, not one
// scalar repeated barCount times (that would make every bar move identically,
// defeating the point of a bar visualizer).
function computeVolumeBands(analyser: AnalyserNode, freqBuf: Uint8Array<ArrayBuffer>, barCount: number): number[] {
  analyser.getByteFrequencyData(freqBuf)
  const bands = new Array(barCount).fill(0)
  const bucketSize = Math.max(1, Math.floor(freqBuf.length / barCount))
  for (let i = 0; i < barCount; i++) {
    let sum = 0
    const start = i * bucketSize
    const end = Math.min(freqBuf.length, start + bucketSize)
    for (let j = start; j < end; j++) sum += freqBuf[j]
    const avg = sum / (end - start || 1) / 255
    // Small gain -- higher-frequency bins tend to read quieter than low
    // ones, so a flat 1.0 multiplier under-represents the upper bars.
    bands[i] = Math.min(1, avg * 1.6)
  }
  return bands
}

// Wraps `source` in its own GainNode and applies a short linear fade in/out
// around [startAt, startAt+duration]. This exists because two independently
// generated TTS clips (or an HTMLAudioElement's imprecise start/stop timing)
// have no guaranteed amplitude continuity at their edges -- starting or
// stopping away from a zero-crossing is exactly what a click/crackle is.
// Ramping through silence at every boundary removes that discontinuity
// regardless of what produced it.
function connectWithFade(
  ctx: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  startAt: number,
  duration: number,
  fadeSeconds = 0.006
): GainNode {
  const gain = ctx.createGain()
  const fade = Math.min(fadeSeconds, Math.max(0.001, duration / 2))
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(1, startAt + fade)
  gain.gain.setValueAtTime(1, Math.max(startAt + fade, startAt + duration - fade))
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  source.connect(gain)
  gain.connect(destination)
  return gain
}

// ---------------------------------------------------------------------------
// Puter.js loader -- injects the script tag once, resolves when window.puter
// is actually available. Real, documented API: puter.ai.txt2speech(text, opts)
// -> Promise<HTMLAudioElement>. https://docs.puter.com/AI/txt2speech/
// ---------------------------------------------------------------------------
let puterLoadPromise: Promise<any> | null = null
function loadPuter(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if ((window as any).puter) return Promise.resolve((window as any).puter)
  if (puterLoadPromise) return puterLoadPromise

  puterLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://js.puter.com/v2/"
    script.onload = () => {
      if ((window as any).puter) resolve((window as any).puter)
      else reject(new Error("Puter script loaded but window.puter is missing"))
    }
    script.onerror = () => reject(new Error("Failed to load Puter.js"))
    document.head.appendChild(script)
  })
  return puterLoadPromise
}

type Caption = { source: string; translated: string } | null
type CallStatus = "idle" | "listening" | "processing" | "speaking"

const VISUALIZER_STATE_MAP: Record<CallStatus, "connecting" | "listening" | "speaking" | "thinking"> = {
  idle: "connecting",
  listening: "listening",
  processing: "thinking",
  speaking: "speaking",
}

// Bar's prop table has no colorShift (that's Aura-specific) -- just color.
// Reusing the same per-state hues as the call dialog for consistency of
// meaning across the app (amber = active/speaking, cream = listening, etc.),
// while the shape/animation itself is what actually makes this feel distinct.
const VISUALIZER_STYLE_MAP: Record<CallStatus, { color: `#${string}` }> = {
  idle: { color: "#8C8D93" },
  listening: { color: "#F3F1EA" },
  processing: { color: "#E8A33D" },
  speaking: { color: "#E8A33D" },
}

const BAR_COUNT = 5

export type ModalVoiceTranslatorProps = {
  isOpen: boolean
  onClose: () => void
}

export type LiveTranslationDialogProps = ModalVoiceTranslatorProps

export function ModalVoiceTranslator({ isOpen, onClose }: ModalVoiceTranslatorProps) {
  const [status, setStatus] = useState<CallStatus>("idle")
  const [caption, setCaption] = useState<Caption>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volumeBands, setVolumeBands] = useState<number[]>(() => new Array(BAR_COUNT).fill(0))

  const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES[0])
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]) // default target: Shona
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false)
  const [targetPickerOpen, setTargetPickerOpen] = useState(false)
  const sourcePickerRef = useRef<HTMLDivElement>(null)
  const targetPickerRef = useRef<HTMLDivElement>(null)

  const [voices, setVoices] = useState<string[]>(FALLBACK_VOICES)
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    if (typeof window === "undefined") return "visionary"
    return window.localStorage.getItem("live_translate_voice") || "visionary"
  })
  const [voicePickerOpen, setVoicePickerOpen] = useState(false)
  const voicePickerRef = useRef<HTMLDivElement>(null)

  const [useLtrans, setUseLtrans] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem("live_translate_use_ltrans") === "true"
  })

  const speechRecognitionRef = useRef<any>(null)
  const [isSpeechRecognizing, setIsSpeechRecognizing] = useState(false)

  // shared playback graph -- both our own PCM path and Puter's
  // HTMLAudioElement path route through this ONE analyser, so the
  // visualizer reacts the same way regardless of which TTS engine spoke.
  const playbackCtxRef = useRef<AudioContext | null>(null)
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null)
  const nextStartTimeRef = useRef<number>(0)

  const micStreamRef = useRef<MediaStream | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)

  // cancellation token for the current utterance's translate+speak pipeline,
  // so starting a new recognition mid-pipeline doesn't race with the old one
  const pipelineTokenRef = useRef(0)

  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  // ---------- load real voice list (used only when target is Shona) ----------
  useEffect(() => {
    if (!isOpen) return
    const controller = new AbortController()
      ; (async () => {
        try {
          const res = await fetch(`${API_ORIGIN}/v1/voices`, { signal: controller.signal })
          if (!res.ok) return
          const data = await res.json()
          if (Array.isArray(data.voices) && data.voices.length > 0) setVoices(data.voices)
        } catch {
          // FALLBACK_VOICES keeps the picker usable
        }
      })()
    return () => controller.abort()
  }, [isOpen])

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("live_translate_voice", selectedVoice)
  }, [selectedVoice])

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("live_translate_use_ltrans", String(useLtrans))
  }, [useLtrans])

  // ---------- close pickers on outside click / Escape ----------
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sourcePickerRef.current && !sourcePickerRef.current.contains(e.target as Node)) setSourcePickerOpen(false)
      if (targetPickerRef.current && !targetPickerRef.current.contains(e.target as Node)) setTargetPickerOpen(false)
      if (voicePickerRef.current && !voicePickerRef.current.contains(e.target as Node)) setVoicePickerOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSourcePickerOpen(false)
        setTargetPickerOpen(false)
        setVoicePickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [])

  const stopMicMeter = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    micAnalyserRef.current = null
    micCtxRef.current?.close().catch(() => { })
    micCtxRef.current = null
  }, [])

  const startMicMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser) // never connected onward -- we don't want to hear ourselves
      micCtxRef.current = ctx
      micAnalyserRef.current = analyser
    } catch (err) {
      console.warn("Mic level meter unavailable:", err)
    }
  }, [])

  // ---------- cleanup on close ----------
  useEffect(() => {
    if (!isOpen) {
      try { speechRecognitionRef.current?.stop() } catch { }
      stopMicMeter()
      pipelineTokenRef.current++ // invalidate any in-flight pipeline
      setIsSpeechRecognizing(false)
      setStatus("idle")
      setCaption(null)
    }
  }, [isOpen, stopMicMeter])

  const getPlaybackCtx = useCallback(async (): Promise<{ ctx: AudioContext; analyser: AnalyserNode }> => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.connect(ctx.destination)
      playbackCtxRef.current = ctx
      playbackAnalyserRef.current = analyser
    }
    if (playbackCtxRef.current.state === "suspended") await playbackCtxRef.current.resume()
    return { ctx: playbackCtxRef.current, analyser: playbackAnalyserRef.current! }
  }, [])

  useEffect(() => {
    if (isOpen) getPlaybackCtx().catch(() => { })
  }, [isOpen, getPlaybackCtx])

  // ---------- per-band volume meter feeding the bar visualizer ----------
  useEffect(() => {
    if (!isOpen) return
    let rafId: number
    const freqBuf = new Uint8Array(128) as Uint8Array<ArrayBuffer> // matches fftSize=256 on both analysers

    const tick = () => {
      let analyser: AnalyserNode | null = null
      if (status === "speaking") analyser = playbackAnalyserRef.current
      else if (status === "listening") analyser = micAnalyserRef.current

      if (analyser) {
        setVolumeBands(computeVolumeBands(analyser, freqBuf, BAR_COUNT))
      } else {
        // Avoid a fresh array + re-render every idle frame -- only reset
        // once when we actually transition to silence.
        setVolumeBands((prev) => (prev.some((v) => v !== 0) ? new Array(BAR_COUNT).fill(0) : prev))
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isOpen, status])

  // ---------- schedule ONE already-synthesized PCM clip (Shona path) ----------
  // `waitForEnd=false` schedules the clip (via the same gapless
  // nextStartTimeRef chaining the call dialog uses) and resolves
  // immediately, without waiting for playback to actually finish -- used
  // when multiple independently generated clips for one translated
  // sentence need to be queued back-to-back with zero gap between the
  // scheduling calls themselves. `waitForEnd=true` (the default, used for
  // the last clip in a batch) waits for real playback completion, which is
  // what the outer per-sentence pipeline uses to pace "when to translate
  // and speak the next sentence."
  const playPcmSentence = useCallback(
    async (
      pcmBytes: Uint8Array,
      sampleRate: number,
      waitForEnd: boolean = true
    ): Promise<{ startAt: number; duration: number } | null> => {
      if (isMuted) return null
      const { ctx, analyser } = await getPlaybackCtx()
      const int16 = new Int16Array(pcmBytes.buffer as ArrayBuffer, pcmBytes.byteOffset, pcmBytes.length / 2)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768

      const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate)
      audioBuffer.copyToChannel(float32, 0)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer

      const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current)
      const duration = audioBuffer.duration
      nextStartTimeRef.current = startAt + duration

      // Every clip gets its own short fade-in/out, whether or not it's
      // adjacent to another clip -- cheap, and it's what actually prevents
      // a click at this specific boundary regardless of what's on the
      // other side of it.
      connectWithFade(ctx, source, analyser, startAt, duration)

      return new Promise((resolve) => {
        if (waitForEnd) {
          source.onended = () => resolve({ startAt, duration })
          source.start(startAt)
        } else {
          source.start(startAt)
          resolve({ startAt, duration })
        }
      })
    },
    [getPlaybackCtx, isMuted]
  )

  // ---------- fetch + play one CLIENT sentence's Shona TTS via /v1/tts/speak-stream ----------
  // The backend may split this single piece of text into more than one
  // independently generated clip (server-side sentence splitting doesn't
  // know about the client's own split). Each arrives as its own
  // audio_chunk event carrying `index` -- chunks are grouped by that index
  // and each group is scheduled as its OWN buffer. They are never
  // concatenated across indices: two separately generated clips have no
  // guaranteed amplitude continuity at a shared seam, and splicing their
  // raw bytes together bakes a click directly into the waveform, which no
  // amount of playback scheduling can undo afterward.
  const speakShonaSentence = useCallback(
    async (text: string, token: number): Promise<void> => {
      const resp = await fetch(`${API_ORIGIN}/v1/tts/speak-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice }),
      })
      if (!resp.ok || !resp.body) throw new Error(`TTS returned HTTP ${resp.status}`)

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      const perClipChunks: Record<number, { chunks: Uint8Array[]; sampleRate: number }> = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() || ""
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith("data: ")) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === "audio_chunk") {
            // Field name isn't confirmed against the live backend response
            // for this route -- reads either shape defensively.
            const idx = event.index ?? event.sentence_index ?? 0
            if (!perClipChunks[idx]) {
              perClipChunks[idx] = { chunks: [], sampleRate: event.sample_rate || 24000 }
            }
            perClipChunks[idx].chunks.push(base64ToUint8Array(event.data))
          }
        }
      }

      if (pipelineTokenRef.current !== token) return // superseded by a newer utterance

      const indices = Object.keys(perClipChunks).map(Number).sort((a, b) => a - b)
      for (let i = 0; i < indices.length; i++) {
        if (pipelineTokenRef.current !== token) return
        const { chunks, sampleRate } = perClipChunks[indices[i]]
        const totalLen = chunks.reduce((s, c) => s + c.length, 0)
        const merged = new Uint8Array(totalLen)
        let offset = 0
        for (const c of chunks) {
          merged.set(c, offset)
          offset += c.length
        }
        const isLast = i === indices.length - 1
        // All but the last clip are scheduled back-to-back with no gap
        // between the *scheduling* calls -- Web Audio's own clock lines
        // them up gaplessly. Only the last one is actually awaited, so the
        // outer pipeline still paces "move to next sentence" off real
        // playback completion, same as before.
        await playPcmSentence(merged, sampleRate, isLast)
      }
    },
    [selectedVoice, playPcmSentence]
  )

  // ---------- play one sentence via Puter/ElevenLabs TTS (non-Shona path) ----------
  // Real voice IDs from your own ElevenLabs account, keyed by the same
  // names used for the Shona reference voices. Falls back to no explicit
  // voice (Puter/ElevenLabs default) if a name isn't in the map -- covers
  // the case where /v1/voices ever returns a name not yet added here.
  const speakPuterSentence = useCallback(
    async (text: string, lang: Language, voiceName: string, token: number): Promise<void> => {
      const t0 = performance.now()
      const puter = await loadPuter()
      const elevenLabsVoiceId = ELEVENLABS_VOICE_IDS[voiceName]

      let audio: HTMLAudioElement
      try {
        audio = await puter.ai.txt2speech(text, {
          provider: "elevenlabs",
          model: "eleven_multilingual_v2",
          language: lang.puterLang,
          ...(elevenLabsVoiceId ? { voice: elevenLabsVoiceId } : {}),
        })
      } catch (err) {
        // If a stranger's Puter session can't actually use your custom
        // voice ID, this is where it'll surface -- log it plainly rather
        // than letting it look like a generic network failure.
        console.error(
          `[puter-tts] txt2speech failed for voice="${voiceName}" (id=${elevenLabsVoiceId ?? "none"}), ` +
          `lang=${lang.puterLang}. This may mean this Puter session can't access that ElevenLabs voice ID.`,
          err
        )
        throw err
      }

      const genMs = performance.now() - t0
      console.log(
        `[puter-tts] generation+relay took ${genMs.toFixed(0)}ms for ${text.length} chars ` +
        `(voice=${voiceName}, lang=${lang.puterLang}) -- this is real, not a borrowed claim`
      )

      if (pipelineTokenRef.current !== token) return

      const { ctx, analyser } = await getPlaybackCtx()
      const source = ctx.createMediaElementSource(audio)

      // Same fade treatment as the PCM path. HTMLAudioElement start/stop
      // timing isn't sample-accurate the way a scheduled
      // AudioBufferSourceNode is, so this uses a slightly longer ramp and
      // a best-effort end-guard based on the element's own reported
      // duration once it's known.
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(analyser)
      const FADE = 0.02

      const tPlayStart = performance.now()
      return new Promise((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = (e) => {
          console.error(`[puter-tts] playback error for voice="${voiceName}":`, e)
          reject(new Error("Puter TTS playback failed"))
        }
        audio.addEventListener("loadedmetadata", () => {
          if (isFinite(audio.duration) && audio.duration > FADE * 2) {
            const endGuardMs = Math.max(0, (audio.duration - FADE) * 1000)
            setTimeout(() => {
              try {
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE)
              } catch { }
            }, endGuardMs)
          }
        })
        audio.play()
          .then(() => {
            gain.gain.setValueAtTime(0, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE)
            console.log(`[puter-tts] playback actually started ${(performance.now() - tPlayStart).toFixed(0)}ms after audio element was ready`)
          })
          .catch(reject)
      })
    },
    [getPlaybackCtx]
  )

  // ---------- the actual pipeline: split -> translate -> speak, sentence by sentence ----------
  // Sentences are pre-split from the SOURCE text, each translated
  // independently, and spoken as soon as its own translation is ready --
  // sentence 2 translates while sentence 1 is already playing.
  const runTranslationPipeline = useCallback(
    async (sourceText: string) => {
      const token = ++pipelineTokenRef.current
      setStatus("processing")
      setError(null)
      nextStartTimeRef.current = 0

      const sentences = splitIntoSentences(sourceText)
      const isShonaTarget = targetLang.nllb === "sna_Latn"

      for (const sentence of sentences) {
        if (pipelineTokenRef.current !== token) return // a newer utterance superseded this one

        try {
          let translated: string
          if (useLtrans) {
            translated = await translateWithLLM(sentence, sourceLang.label, targetLang.label)
          } else {
            const translateResp = await fetch(`${API_ORIGIN}/v1/translate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: sentence,
                source_lang: sourceLang.nllb,
                target_lang: targetLang.nllb,
              }),
            })
            if (!translateResp.ok) throw new Error(`Translate returned HTTP ${translateResp.status}`)
            const data = await translateResp.json()
            translated = data.text
          }

          if (pipelineTokenRef.current !== token) return

          setCaption({ source: sentence, translated })
          setStatus("speaking")

          if (isShonaTarget) {
            await speakShonaSentence(translated, token)
          } else {
            await speakPuterSentence(translated, targetLang, selectedVoice, token)
          }
        } catch (e: any) {
          console.error(e)
          if (pipelineTokenRef.current === token) setError(e.message || "Translation/speech failed")
        }
      }

      if (pipelineTokenRef.current === token) setStatus("idle")
    },
    [sourceLang, targetLang, selectedVoice, useLtrans, speakShonaSentence, speakPuterSentence]
  )

  const toggleSpeechRecognition = useCallback(() => {
    if (isSpeechRecognizing) {
      try { speechRecognitionRef.current?.stop() } catch { }
      setIsSpeechRecognizing(false)
      stopMicMeter()
      setStatus("idle")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Speech recognition isn't supported in this browser.")
      return
    }

    try {
      const recognition = new SpeechRecognition()
      speechRecognitionRef.current = recognition
      recognition.lang = sourceLang.bcp47
      recognition.continuous = false
      recognition.interimResults = false

      let finalText = ""

      recognition.onstart = () => {
        setIsSpeechRecognizing(true)
        setStatus("listening")
        setError(null)
        setCaption(null)
        startMicMeter()
      }

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " "
        }
      }

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") setError(`Speech recognition error: ${event.error}`)
        setIsSpeechRecognizing(false)
        stopMicMeter()
        setStatus("idle")
      }

      recognition.onend = () => {
        setIsSpeechRecognizing(false)
        stopMicMeter()
        const text = finalText.trim()
        if (text) runTranslationPipeline(text)
        else setStatus("idle")
      }

      recognition.start()
    } catch (e: any) {
      setError(e.message || "Failed to start speech recognition")
      setIsSpeechRecognizing(false)
      stopMicMeter()
    }
  }, [isSpeechRecognizing, sourceLang, startMicMeter, stopMicMeter, runTranslationPipeline])

  if (!isOpen) return null

  const statusLabel = { idle: "Ready", listening: "Listening", processing: "Translating", speaking: "Speaking" }[status]
  const visualizerStyle = VISUALIZER_STYLE_MAP[status]
  const avgVolume = volumeBands.reduce((a, b) => a + b, 0) / (volumeBands.length || 1)

  const LangPicker = ({
    label,
    value,
    onChange,
    open,
    setOpen,
    pickerRef,
  }: {
    label: string
    value: Language
    onChange: (l: Language) => void
    open: boolean
    setOpen: (v: boolean) => void
    pickerRef: React.RefObject<HTMLDivElement | null>
  }) => (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-[#2A2B30] bg-[#111216] px-3 py-1.5 text-xs font-medium text-[#F3F1EA] transition hover:border-[#E8A33D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
      >
        <span className="text-[#8C8D93]">{label}:</span> {value.label}
        <ChevronDown className={cn("h-3.5 w-3.5 text-[#8C8D93] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-2 w-40 overflow-hidden rounded-2xl border border-[#2A2B30] bg-[#111216] py-1 shadow-lg shadow-black/40">
          {LANGUAGES.map((l) => (
            <button
              key={l.label}
              onClick={() => { onChange(l); setOpen(false) }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition",
                l.label === value.label ? "text-[#E8A33D]" : "text-[#F3F1EA] hover:bg-[#17181B]"
              )}
            >
              {l.label}
              {l.label === value.label && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0E0F12] text-[#F3F1EA]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3F1EA]/[0.06] px-6 py-4">
        <p className="text-sm font-medium">Live translation</p>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8C8D93] transition hover:text-[#F3F1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Language and Voice Pickers */}
      <div className="flex items-center justify-center gap-3 px-6 py-3">
        <LangPicker label="From" value={sourceLang} onChange={setSourceLang} open={sourcePickerOpen} setOpen={setSourcePickerOpen} pickerRef={sourcePickerRef} />
        <span className="text-[#8C8D93]">&rarr;</span>
        <LangPicker label="To" value={targetLang} onChange={setTargetLang} open={targetPickerOpen} setOpen={setTargetPickerOpen} pickerRef={targetPickerRef} />

        {/* voice picker applies to BOTH engines */}
        <div className="relative" ref={voicePickerRef}>
          <button
            onClick={() => setVoicePickerOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-[#2A2B30] bg-[#111216] px-3 py-1.5 text-xs font-medium capitalize text-[#F3F1EA] transition hover:border-[#E8A33D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
          >
            {selectedVoice}
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#8C8D93] transition-transform", voicePickerOpen && "rotate-180")} />
          </button>
          {voicePickerOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 w-40 overflow-hidden rounded-2xl border border-[#2A2B30] bg-[#111216] py-1 shadow-lg shadow-black/40">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => { setSelectedVoice(v); setVoicePickerOpen(false) }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-xs capitalize transition",
                    v === selectedVoice ? "text-[#E8A33D]" : "text-[#F3F1EA] hover:bg-[#17181B]"
                  )}
                >
                  {v}
                  {v === selectedVoice && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Use Ltrans -- routes every language pair through Groq via the
            server-side proxy instead of NLLB. Off by default: NLLB is
            faster and cheaper when it's producing acceptable output; this
            is for the pairs where it isn't. */}
        <button
          onClick={() => setUseLtrans((v) => !v)}
          title="Use Ltrans (Groq LLM translation instead of NLLB)"
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]",
            useLtrans
              ? "border-[#E8A33D]/60 bg-[#E8A33D]/10 text-[#E8A33D]"
              : "border-[#2A2B30] bg-[#111216] text-[#8C8D93] hover:text-[#F3F1EA]"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              useLtrans ? "bg-[#E8A33D]" : "bg-[#5C5D63]"
            )}
          />
          Use Ltrans
        </button>
      </div>

      {/* Hero Visualizer & Captions */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6">
        {/* Wide + short, unlike the call dialog's square ring -- deliberately
            a different silhouette, not just a different component. */}
        <div className="relative flex h-28 w-64 items-center justify-center sm:w-80">
          {/* Horizontal blurred strip, not a circular halo -- shaped to
              match bars instead of being a leftover ring treatment. */}
          <div
            className="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-300"
            style={{
              backgroundColor: visualizerStyle.color,
              opacity: 0.15 + avgVolume * 0.35,
              transform: `translateY(-50%) scaleX(${1 + avgVolume * 0.35})`,
            }}
          />
          <AgentAudioVisualizerBar
            size="xl"
            color={visualizerStyle.color}
            barCount={BAR_COUNT}
            state={VISUALIZER_STATE_MAP[status]}
            volumeBands={volumeBands}
            className="relative"
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: visualizerStyle.color }}
          />
          <p className="text-sm text-[#8C8D93]">{statusLabel}</p>
        </div>

        {caption && (
          <div className="flex w-full max-w-sm flex-col gap-1.5 px-2 text-center">
            <p className="text-sm text-[#8C8D93]">{caption.source}</p>
            <p className="text-[17px] font-medium text-[#F3F1EA]">{caption.translated}</p>
          </div>
        )}

        {error && <p className="max-w-sm text-center text-sm text-[#C1543A]">{error}</p>}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 px-6 pb-8">
        <div className="mx-auto flex items-center gap-2 rounded-full border border-[#2A2B30] bg-[#111216]/80 px-3 py-2 backdrop-blur">
          <button
            onClick={() => setIsMuted((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#8C8D93] transition hover:text-[#F3F1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <div className="relative mx-1">
            {isSpeechRecognizing && !reducedMotion && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#E8A33D]/30" />
            )}
            <button
              onClick={toggleSpeechRecognition}
              disabled={status === "processing" || status === "speaking"}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D] disabled:opacity-40",
                isSpeechRecognizing ? "bg-[#E8A33D] text-[#0E0F12]" : "bg-[#17181B] text-[#F3F1EA]"
              )}
              title="Tap to speak"
            >
              <Mic className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ModalVoiceTranslator as LiveTranslationDialog }