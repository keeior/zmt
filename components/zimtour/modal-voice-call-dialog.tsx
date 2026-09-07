"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Mic, Volume2, VolumeX, Captions, PhoneOff, Keyboard, Send, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura"

const DEFAULT_AGENT_ENDPOINT =
  process.env.NEXT_PUBLIC_AGENT_ENDPOINT ||
  "https://justice-keeper24--shona-unified-voice-pipeline-fastapi-app.modal.run/v1/agent/respond-stream"

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export type ModalVoiceCallDialogProps = {
  isOpen: boolean
  onClose: () => void
  agentEndpoint?: string
}

type Caption = { role: "you" | "agent"; text: string } | null
type CallStatus = "idle" | "listening" | "processing" | "speaking"

const AURA_STATE_MAP: Record<CallStatus, "connecting" | "listening" | "speaking" | "thinking"> = {
  idle: "connecting",
  listening: "listening",
  processing: "thinking",
  speaking: "speaking",
}

// Reuses the same per-state palette already established for the status dot
// below — one intentional identity for the call screen, not a second
// unrelated color scheme just for the Aura. colorShift is higher for the
// more "active" states so the shader reads calmer at rest, livelier when
// something is actually happening.
const AURA_STYLE_MAP: Record<CallStatus, { color: `#${string}`; colorShift: number }> = {
  idle: { color: "#8C8D93", colorShift: 0.08 },
  listening: { color: "#F3F1EA", colorShift: 0.14 },
  processing: { color: "#E8A33D", colorShift: 0.2 },
  speaking: { color: "#E8A33D", colorShift: 0.3 },
}

// Used until GET /v1/voices responds — keeps the picker populated even if
// that request is slow or fails, rather than showing an empty list. Must
// stay in sync with the backend's VOICE_FILES keys if voices are ever
// added/renamed there.
const FALLBACK_VOICES = ["visionary", "bella", "ivvan", "jessica", "laura", "sarah", "tatenda"]

// One sentence's caption timing, synced to the AudioContext clock that
// actually schedules its playback — not wall-clock time, so a word reveal
// tick and a `source.start(startAt)` call are measuring the same clock.
type SentenceCaption = {
  idx: number
  words: string[]
  startAt: number | null // AudioContext.currentTime the audio actually starts
  duration: number | null // seconds
}

export function ModalVoiceCallDialog({
  isOpen,
  onClose,
  agentEndpoint = DEFAULT_AGENT_ENDPOINT,
}: ModalVoiceCallDialogProps) {
  const [status, setStatus] = useState<CallStatus>("idle")
  const [caption, setCaption] = useState<Caption>(null)
  const [prevCaption, setPrevCaption] = useState<Caption>(null)
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showTextInput, setShowTextInput] = useState(false)
  const [inputText, setInputText] = useState("")
  const [volume, setVolume] = useState(0) // 0..1, feeds the Aura's real audio-reactivity
  const [voices, setVoices] = useState<string[]>(FALLBACK_VOICES)
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    if (typeof window === "undefined") return "visionary"
    return window.localStorage.getItem("zimtour_voice") || "visionary"
  })

  const agentTurnActiveRef = useRef(false)
  const speechRecognitionRef = useRef<any>(null)
  const [isSpeechRecognizing, setIsSpeechRecognizing] = useState(false)

  const playbackCtxRef = useRef<AudioContext | null>(null)
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null)
  const nextStartTimeRef = useRef<number>(0)
  const sentenceBuffersRef = useRef<Record<number, { chunks: Uint8Array[]; sampleRate: number }>>({})

  // Caption sync state — one entry per sentence in the current agent turn.
  const agentTurnSentencesRef = useRef<SentenceCaption[]>([])
  const lastRevealedSentenceIdxRef = useRef<number | null>(null)
  // Mirrors lastRevealedSentenceIdxRef but as state, purely so JSX can key
  // the caption's enter transition on it — refs don't trigger re-renders.
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null)
  const [voicePickerOpen, setVoicePickerOpen] = useState(false)
  const voicePickerRef = useRef<HTMLDivElement>(null)

  // Separate mic tap purely for visualizing the user's own voice while
  // "listening" — SpeechRecognition doesn't expose raw audio, so this runs
  // alongside it. Never connected to destination; we don't want to hear
  // ourselves.
  const micStreamRef = useRef<MediaStream | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)

  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  // ---------- Caption updates, tracking the previous line for the fading context row ----------
  const updateCaption = useCallback((updater: (prev: Caption) => Caption) => {
    setCaption((prev) => {
      const next = updater(prev)
      if (prev && next && prev.role !== next.role) {
        setPrevCaption(prev)
      } else if (!prev && next) {
        setPrevCaption(null)
      }
      return next
    })
  }, [])

  // ---------- Call duration timer ----------
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isOpen) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(timer)
  }, [isOpen])

  // ---------- Load real voice list; keep FALLBACK_VOICES if it fails ----------
  useEffect(() => {
    if (!isOpen) return
    const controller = new AbortController()
      ; (async () => {
        try {
          const origin = new URL(agentEndpoint).origin
          const res = await fetch(`${origin}/v1/voices`, { signal: controller.signal })
          if (!res.ok) return
          const data = await res.json()
          if (Array.isArray(data.voices) && data.voices.length > 0) {
            setVoices(data.voices)
          }
        } catch {
          // Not worth surfacing as a call error — FALLBACK_VOICES keeps the
          // picker usable, and voice selection isn't essential to the call.
        }
      })()
    return () => controller.abort()
  }, [isOpen, agentEndpoint])

  // ---------- Persist voice choice across calls ----------
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("zimtour_voice", selectedVoice)
    }
  }, [selectedVoice])

  // ---------- Close the custom voice picker on outside click or Escape ----------
  useEffect(() => {
    if (!voicePickerOpen) return
    const handleClick = (e: MouseEvent) => {
      if (voicePickerRef.current && !voicePickerRef.current.contains(e.target as Node)) {
        setVoicePickerOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVoicePickerOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [voicePickerOpen])

  // ---------- Mic level meter (start/stop) ----------
  const startMicMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser) // deliberately not connected onward to destination
      micCtxRef.current = ctx
      micAnalyserRef.current = analyser
    } catch (err) {
      // Mic visualization is a nice-to-have — recognition itself doesn't
      // depend on this, so failing here shouldn't surface as a call error.
      console.warn("Mic level meter unavailable:", err)
    }
  }, [])

  const stopMicMeter = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    micAnalyserRef.current = null
    micCtxRef.current?.close().catch(() => { })
    micCtxRef.current = null
  }, [])

  // ---------- Cleanup on close ----------
  useEffect(() => {
    if (!isOpen) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop()
        } catch { }
      }
      stopMicMeter()
      setIsSpeechRecognizing(false)
      setStatus("idle")
      setCaption(null)
      setPrevCaption(null)
      agentTurnSentencesRef.current = []
      lastRevealedSentenceIdxRef.current = null
      setActiveSentenceIdx(null)
    }
  }, [isOpen, stopMicMeter])

  const getPlaybackCtx = useCallback(async (): Promise<AudioContext> => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.connect(ctx.destination)
      playbackCtxRef.current = ctx
      playbackAnalyserRef.current = analyser
    }
    if (playbackCtxRef.current.state === "suspended") {
      await playbackCtxRef.current.resume()
    }
    return playbackCtxRef.current
  }, [])

  useEffect(() => {
    if (isOpen) getPlaybackCtx().catch(() => { })
  }, [isOpen, getPlaybackCtx])

  // ---------- Unified volume meter: whichever analyser matches the current
  // status drives the Aura's `volume` prop with real amplitude, every frame.
  useEffect(() => {
    if (!isOpen) return
    let rafId: number
    const buf = new Uint8Array(128)

    const tick = () => {
      let analyser: AnalyserNode | null = null
      if (status === "speaking") analyser = playbackAnalyserRef.current
      else if (status === "listening") analyser = micAnalyserRef.current

      if (analyser) {
        analyser.getByteTimeDomainData(buf)
        let sumSq = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sumSq += v * v
        }
        const rms = Math.sqrt(sumSq / buf.length)
        // Small gain so ordinary speech registers visually instead of
        // sitting near-flat — tune this if it feels over/under-sensitive.
        setVolume(Math.min(1, rms * 3.2))
      } else {
        setVolume(0)
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isOpen, status])

  // ---------- Caption reveal ticker: shows ONE sentence at a time — the one
  // currently inside its real audio window — revealing its words
  // progressively. Moving to a new sentence pushes the finished one into
  // the fading "previous line" slot instead of stacking every sentence
  // into one ever-growing block; that swap is what actually gives the
  // TikTok-style feel instead of a wall of text.
  useEffect(() => {
    if (!isOpen) return
    let rafId: number

    const tick = () => {
      const ctx = playbackCtxRef.current
      if (ctx) {
        const now = ctx.currentTime
        let active: SentenceCaption | null = null
        for (const sent of agentTurnSentencesRef.current) {
          if (sent.startAt != null && now >= sent.startAt) active = sent
        }

        if (active) {
          if (lastRevealedSentenceIdxRef.current !== active.idx) {
            const prevSent = agentTurnSentencesRef.current.find(
              (s) => s.idx === lastRevealedSentenceIdxRef.current
            )
            if (prevSent) {
              setPrevCaption({ role: "agent", text: prevSent.words.join(" ") })
            }
            lastRevealedSentenceIdxRef.current = active.idx
            setActiveSentenceIdx(active.idx)
          }

          const elapsed = now - active.startAt!
          const frac = active.duration ? Math.min(1, elapsed / active.duration) : 1
          const count = Math.max(1, Math.ceil(frac * active.words.length))
          setCaption({ role: "agent", text: active.words.slice(0, count).join(" ") })
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isOpen])

  // Returns real playback timing so the caption ticker can sync to the
  // exact same clock the audio is scheduled on — sample-accurate, not a
  // wall-clock guess.
  const schedulePcmPlayback = useCallback(
    async (int16Bytes: Uint8Array, sampleRate: number): Promise<{ startAt: number; duration: number } | null> => {
      if (isMuted) return null
      try {
        const ctx = await getPlaybackCtx()
        const int16 = new Int16Array(int16Bytes.buffer, int16Bytes.byteOffset, int16Bytes.length / 2)
        const float32 = new Float32Array(int16.length)
        for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768

        const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate)
        audioBuffer.copyToChannel(float32, 0)

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        // Route through the shared analyser (still reaches destination via
        // its own connection) so the volume meter sees this sentence's audio.
        source.connect(playbackAnalyserRef.current ?? ctx.destination)

        const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current)
        source.start(startAt)
        nextStartTimeRef.current = startAt + audioBuffer.duration
        return { startAt, duration: audioBuffer.duration }
      } catch (err) {
        console.error("PCM playback error:", err)
        return null
      }
    },
    [getPlaybackCtx, isMuted]
  )

  const handleEvent = useCallback(
    (event: any) => {
      switch (event.type) {
        case "user_text":
          updateCaption(() => ({ role: "you", text: event.text }))
          break

        case "agent_text": {
          const idx = event.index ?? 0
          const words = String(event.text || "").split(/\s+/).filter(Boolean)
          if (!agentTurnActiveRef.current) {
            agentTurnActiveRef.current = true
            agentTurnSentencesRef.current = []
          }
          agentTurnSentencesRef.current.push({ idx, words, startAt: null, duration: null })
          setStatus("speaking")
          break
        }

        case "audio_chunk": {
          const idx = event.sentence_index ?? 0
          if (!sentenceBuffersRef.current[idx]) {
            sentenceBuffersRef.current[idx] = { chunks: [], sampleRate: event.sample_rate || 24000 }
          }
          if (event.data) sentenceBuffersRef.current[idx].chunks.push(base64ToUint8Array(event.data))
          break
        }

        case "sentence_done": {
          const idx = event.index ?? 0
          const entry = sentenceBuffersRef.current[idx]
          if (entry) {
            const totalLen = entry.chunks.reduce((sum, c) => sum + c.length, 0)
            const merged = new Uint8Array(totalLen)
            let offset = 0
            for (const c of entry.chunks) {
              merged.set(c, offset)
              offset += c.length
            }
            schedulePcmPlayback(merged, entry.sampleRate).then((timing) => {
              const sentEntry = agentTurnSentencesRef.current.find((s) => s.idx === idx)
              if (!sentEntry) return
              if (timing) {
                sentEntry.startAt = timing.startAt
                sentEntry.duration = timing.duration
              } else {
                // Muted or playback failed — nothing to sync to, so reveal
                // this sentence immediately rather than hide it forever.
                const ctx = playbackCtxRef.current
                sentEntry.startAt = ctx ? ctx.currentTime : 0
                sentEntry.duration = 0.001
              }
            })
            delete sentenceBuffersRef.current[idx]
          }
          break
        }

        case "done":
          agentTurnActiveRef.current = false
          setStatus("idle")
          break

        default:
          break
      }
    },
    [schedulePcmPlayback, updateCaption]
  )

  const sendToAgent = useCallback(
    async (text: string) => {
      setStatus("processing")
      setError(null)
      nextStartTimeRef.current = 0
      sentenceBuffersRef.current = {}
      agentTurnActiveRef.current = false
      agentTurnSentencesRef.current = []
      lastRevealedSentenceIdxRef.current = null
      setActiveSentenceIdx(null)

      updateCaption(() => ({ role: "you", text }))

      try {
        const resp = await fetch(agentEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: selectedVoice }),
        })

        if (!resp.ok) throw new Error(`Agent returned HTTP ${resp.status}`)
        if (!resp.body) throw new Error("No response stream")

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n\n")
          buffer = parts.pop() || ""
          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith("data: ")) continue
            try {
              handleEvent(JSON.parse(line.slice(6)))
            } catch (e) {
              console.warn("SSE parse failed:", line, e)
            }
          }
        }
      } catch (e: any) {
        console.error(e)
        setError(e.message || "Something went wrong")
        setStatus("idle")
      }
    },
    [agentEndpoint, handleEvent, updateCaption, selectedVoice]
  )

  const toggleSpeechRecognition = useCallback(() => {
    if (isSpeechRecognizing) {
      try {
        speechRecognitionRef.current?.stop()
      } catch { }
      setIsSpeechRecognizing(false)
      stopMicMeter()
      setStatus("idle")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Speech recognition isn't supported in this browser. Try typing instead.")
      return
    }

    try {
      const recognition = new SpeechRecognition()
      speechRecognitionRef.current = recognition
      recognition.lang = "sn-ZW"
      recognition.continuous = false
      recognition.interimResults = true

      let finalText = ""

      recognition.onstart = () => {
        setIsSpeechRecognizing(true)
        setStatus("listening")
        setError(null)
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
        if (text) {
          sendToAgent(text)
        } else {
          setStatus("idle")
        }
      }

      recognition.start()
    } catch (e: any) {
      setError(e.message || "Failed to start speech recognition")
      setIsSpeechRecognizing(false)
      stopMicMeter()
    }
  }, [isSpeechRecognizing, sendToAgent, startMicMeter, stopMicMeter])

  const handleSendText = () => {
    if (!inputText.trim() || status === "processing") return
    const query = inputText.trim()
    setInputText("")
    setShowTextInput(false)
    sendToAgent(query)
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  if (!isOpen) return null

  const statusLabel = {
    idle: "Ready",
    listening: "Listening",
    processing: "Thinking",
    speaking: "Speaking",
  }[status]

  const auraStyle = AURA_STYLE_MAP[status]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0E0F12] text-[#F3F1EA]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3F1EA]/[0.06] px-6 py-4">
        <div>
          <p className="text-sm font-medium">Shona voice call</p>
          <p className="text-xs text-[#8C8D93] tabular-nums">{formatTimer(callDuration)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={voicePickerRef}>
            <button
              onClick={() => setVoicePickerOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-[#2A2B30] bg-[#111216] px-3 py-1.5 text-xs font-medium capitalize text-[#F3F1EA] transition hover:border-[#E8A33D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
              title="Voice"
            >
              {selectedVoice}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-[#8C8D93] transition-transform duration-200",
                  voicePickerOpen && "rotate-180"
                )}
              />
            </button>

            {voicePickerOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-40 overflow-hidden rounded-2xl border border-[#2A2B30] bg-[#111216] py-1 shadow-lg shadow-black/40">
                {voices.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setSelectedVoice(v)
                      setVoicePickerOpen(false)
                    }}
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

          <button
            onClick={() => setCaptionsEnabled((v) => !v)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]",
              captionsEnabled ? "text-[#E8A33D]" : "text-[#8C8D93] hover:text-[#F3F1EA]"
            )}
            title={captionsEnabled ? "Hide captions" : "Show captions"}
          >
            <Captions className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hero Visualizer & Captions */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        <div className="relative w-52 sm:w-60">
          {/* The one deliberate "boldness" moment: a soft halo behind the
              Aura that breathes with real volume and the current state's
              color. Everything else stays quiet on purpose. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full blur-2xl transition-opacity duration-300"
            style={{
              backgroundColor: auraStyle.color,
              opacity: 0.18 + volume * 0.4,
              transform: `scale(${1.05 + volume * 0.3})`,
            }}
          />
          <AgentAudioVisualizerAura
            size="xl"
            color={auraStyle.color}
            colorShift={auraStyle.colorShift}
            state={AURA_STATE_MAP[status]}
            volume={volume}
            themeMode="dark"
            className="relative aspect-square size-auto w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: auraStyle.color }}
          />
          <p className="text-sm text-[#8C8D93]">{statusLabel}</p>
        </div>

        {captionsEnabled && (caption || prevCaption) && (
          <div className="flex w-full max-w-sm flex-col gap-1.5 px-2" style={{ maxHeight: "8.5rem", overflow: "hidden" }}>
            {prevCaption && (
              <p
                className={cn(
                  "text-sm leading-relaxed text-[#5C5D63] transition-opacity duration-500",
                  prevCaption.role === "agent" ? "self-start border-l-2 border-[#E8A33D]/20 pl-3" : "self-end text-right"
                )}
              >
                {prevCaption.text}
              </p>
            )}
            {caption && (
              <p
                key={caption.role === "agent" ? `agent-${activeSentenceIdx}` : `user-${caption.text}`}
                className={cn(
                  "leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-300",
                  caption.role === "agent"
                    ? "self-start border-l-2 border-[#E8A33D] pl-3 text-[17px] font-medium text-[#F3F1EA]"
                    : "self-end text-right text-[15px] text-[#B9BABF]"
                )}
              >
                {caption.text}
              </p>
            )}
          </div>
        )}

        {error && <p className="max-w-sm text-center text-sm text-[#C1543A]">{error}</p>}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 px-6 pb-8">
        {showTextInput && (
          <div className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-full border border-[#2A2B30] bg-[#111216] px-4 py-2.5">
            <input
              autoFocus
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendText()}
              placeholder="Type in Shona or English"
              className="flex-1 bg-transparent text-sm placeholder-[#8C8D93] outline-none"
            />
            <button onClick={handleSendText} disabled={!inputText.trim()} className="text-[#E8A33D] disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mx-auto flex items-center gap-2 rounded-full border border-[#2A2B30] bg-[#111216]/80 px-3 py-2 backdrop-blur">
          <button
            onClick={() => setIsMuted((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#8C8D93] transition hover:text-[#F3F1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setShowTextInput((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#8C8D93] transition hover:text-[#F3F1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]"
            title="Type instead"
          >
            <Keyboard className="h-5 w-5" />
          </button>

          <div className="relative mx-1">
            {isSpeechRecognizing && !reducedMotion && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#E8A33D]/30" />
            )}
            <button
              onClick={toggleSpeechRecognition}
              disabled={status === "processing"}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D] disabled:opacity-40",
                isSpeechRecognizing ? "bg-[#E8A33D] text-[#0E0F12]" : "bg-[#17181B] text-[#F3F1EA]"
              )}
              title="Tap to speak"
            >
              <Mic className="h-6 w-6" />
            </button>
          </div>

          <div className="mx-1 h-6 w-px bg-[#2A2B30]" />

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C1543A] text-[#F3F1EA] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1543A]"
            title="End call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}