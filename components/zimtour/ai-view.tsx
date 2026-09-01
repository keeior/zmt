"use client"

import { useEffect, useRef, useState } from "react"
import {
  transcribeAudio,
  synthesizeSpeech,
  playAudioBuffer,
  speakTextByLanguage,
  startMicRecording,
  type RecorderHandle,
} from "@/lib/shona-speech"
import {
  Bot,
  Send,
  Sparkles,
  MapPin,
  Mic,
  Paperclip,
  RotateCcw,
  Compass,
  CalendarDays,
  Landmark,
  ShieldCheck,
  Accessibility,
  ShoppingBag,
  ChevronRight,
  Star,
  Clock,
  Users,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Radio,
  Activity,
  Square,
  Loader2,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { img } from "@/lib/zimtour-data"
import { queryGeminiLiveAI, streamGeminiLiveAI, detectToolIntent, type ChatHistoryMessage, type UserLocation, type ToolCallResult } from "@/lib/gemini-live-api"
import { useZimTourStore, LANGUAGE_OPTIONS, setSelectedLanguage } from "@/lib/zimtour-store"
import type { View } from "./types"
import type { PlaceDetail, IndigenousStory, BookingRecord, ReviewItem } from "@/lib/zimtour-api"

type Msg = {
  role: "user" | "ai"
  text: string
  time?: string
  toolResults?: ToolCallResult[]
  isCallingTool?: boolean
  experiences?: {
    id: string
    name: string
    distance: string
    desc: string
    tag: string
    tagType: "available" | "weather"
    seed: string
    duration: string
    group: string
  }[]
}

const CATEGORIES = [
  { icon: Compass, title: "Plan my trip", desc: "Get a personalised itinerary" },
  { icon: CalendarDays, title: "Things to do", desc: "Find activities and experiences" },
  { icon: Landmark, title: "Cultural Guide", desc: "Learn about heritage & history" },
  { icon: ShieldCheck, title: "Travel tips", desc: "Visa, safety, weather and more" },
  { icon: Accessibility, title: "Accessibility help", desc: "Find accessible places & services" },
  { icon: ShoppingBag, title: "Local services", desc: "Transport, dining, shopping & more" },
]

const POPULAR_QUESTIONS = [
  "What can I do in Masvingo in one day?",
  "Tell me the UNESCO oral tradition of Great Zimbabwe.",
  "What are the best places to visit near Lake Mutirikwi?",
  "Tell me about Shona culture and Hungwe birds.",
  "Where can I try authentic local food?",
]

const INITIAL_EXPERIENCES = [
  {
    id: "cultural",
    name: "Local Cultural Experience",
    distance: "8 km",
    desc: "Engage with local communities, learn traditions and enjoy cultural storytelling.",
    tag: "Available today",
    tagType: "available" as const,
    seed: "culturalexp",
    duration: "2–4 hrs",
    group: "Small groups",
  },
  {
    id: "lake",
    name: "Lake Mutirikwi",
    distance: "25 km",
    desc: "Scenic lake views, picnic spots, boating and bird watching.",
    tag: "Good weather",
    tagType: "weather" as const,
    seed: "lakemutirikwi2",
    duration: "Half day",
    group: "Family friendly",
  },
  {
    id: "tugwi",
    name: "Tugwi–Mukosi Ruins",
    distance: "28 km",
    desc: "Ancient city ruins with rich history and breathtaking views.",
    tag: "Available today",
    tagType: "available" as const,
    seed: "tugwimukosi",
    duration: "2–3 hrs",
    group: "Easy hike",
  },
]

export function AIView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const store = useZimTourStore()
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "user",
      text: "What can I do within 30km of Great Zimbabwe today?",
      time: "10:42 AM",
    },
    {
      role: "ai",
      text: "Great choice! Here are some top things you can do within 30km of Great Zimbabwe today:",
      experiences: INITIAL_EXPERIENCES,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ── GEMINI 3.1 LIVE AUDIO CALL STATE ──
  const [isLiveCallActive, setIsLiveCallActive] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  const [liveCallStatus, setLiveCallStatus] = useState<"connecting" | "listening" | "thinking" | "speaking">("listening")
  const [liveCallTranscript, setLiveCallTranscript] = useState("Tap microphone or speak naturally...")
  const [callDurationSec, setCallDurationSec] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)

  // ── GPS LOCATION STATE ──
  const [userLocation, setUserLocation] = useState<UserLocation>(null)
  const [locationStatus, setLocationStatus] = useState<"requesting" | "granted" | "denied" | "unavailable">("requesting")

  // Request GPS on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus("granted")
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLiveCallActive) {
      timer = setInterval(() => setCallDurationSec((s) => s + 1), 1000)
    } else {
      setCallDurationSec(0)
    }
    return () => clearInterval(timer)
  }, [isLiveCallActive])

  // ── Shona & Puter TTS State ──
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recorderRef = useRef<RecorderHandle | null>(null)
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null)
  const stopAudioRef = useRef<(() => void) | null>(null)

  // Speech synthesis speaker output using dynamic TTS router (Shona F5-TTS vs Puter.js)
  async function speakResponse(text: string) {
    if (isSpeakerMuted) return
    setLiveCallStatus("speaking")
    try {
      if (stopAudioRef.current) stopAudioRef.current()
      stopAudioRef.current = await speakTextByLanguage(text, store.selectedLanguage, () => setLiveCallStatus("listening"))
    } catch (err) {
      console.warn("TTS playback failed:", err)
    } finally {
      setTimeout(() => setLiveCallStatus("listening"), 3000)
    }
  }

  // Handle playing TTS for individual AI messages in chat thread
  async function handlePlayMessageSpeech(index: number, text: string) {
    if (speakingMsgIdx === index) {
      if (stopAudioRef.current) stopAudioRef.current()
      setSpeakingMsgIdx(null)
      return
    }

    setSpeakingMsgIdx(index)
    try {
      if (stopAudioRef.current) stopAudioRef.current()
      stopAudioRef.current = await speakTextByLanguage(text, store.selectedLanguage, () => setSpeakingMsgIdx(null))
    } catch (err) {
      console.warn("TTS failed for message:", err)
      setSpeakingMsgIdx(null)
    }
  }

  // Voice recording helper using Shona Whisper STT
  async function toggleMicRecording() {
    if (isRecording && recorderRef.current) {
      setIsRecording(false)
      setIsTranscribing(true)
      try {
        const webmBlob = await recorderRef.current.stop()
        recorderRef.current = null
        const text = await transcribeAudio(webmBlob)
        if (text) {
          setInput(text)
          if (isLiveCallActive) handleLiveUserVoice(text)
        }
      } catch (err) {
        console.error("STT Error:", err)
      } finally {
        setIsTranscribing(false)
      }
      return
    }

    try {
      const handle = await startMicRecording()
      recorderRef.current = handle
      setIsRecording(true)
    } catch (err) {
      console.error("Mic access denied:", err)
    }
  }

  function startVoiceRecording() {
    toggleMicRecording()
  }

  // ── Sentence-Buffered LLM-to-TTS Audio Queue ──
  const audioQueueRef = useRef<string[]>([])
  const isPlayingAudioQueueRef = useRef(false)

  async function enqueueSentenceAudio(sentence: string) {
    if (isSpeakerMuted || !sentence.trim()) return
    audioQueueRef.current.push(sentence.trim())
    if (!isPlayingAudioQueueRef.current) {
      playNextSentenceAudio()
    }
  }

  async function playNextSentenceAudio() {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioQueueRef.current = false
      setLiveCallStatus("listening")
      return
    }

    isPlayingAudioQueueRef.current = true
    setLiveCallStatus("speaking")
    const sentence = audioQueueRef.current.shift()!

    try {
      if (stopAudioRef.current) stopAudioRef.current()
      stopAudioRef.current = await speakTextByLanguage(sentence, store.selectedLanguage, () => {
        playNextSentenceAudio()
      })
    } catch (err) {
      console.warn("Sentence TTS error:", err)
      playNextSentenceAudio()
    }
  }

  async function handleLiveUserVoice(userText: string) {
    if (!userText.trim()) return
    setLiveCallStatus("thinking")
    setLiveCallTranscript(`Processing: "${userText}"`)

    // Clear previous audio queue
    audioQueueRef.current = []
    if (stopAudioRef.current) stopAudioRef.current()

    const history: ChatHistoryMessage[] = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
    }))

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setMessages((m) => [
      ...m,
      { role: "user", text: userText, time: now },
      { role: "ai", text: "...", time: now },
    ])

    let sentenceBuffer = ""

    try {
      const finalReply = await streamGeminiLiveAI(
        userText,
        history,
        (chunk: string, fullText: string) => {
          setMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], text: fullText }
            }
            return updated
          })
          setLiveCallTranscript(fullText)

          // Buffer sentence tokens for instant TTS playback
          sentenceBuffer += chunk
          if (/[.!?;\n]/.test(chunk)) {
            const parts = sentenceBuffer.split(/([.!?;\n])/)
            while (parts.length > 2) {
              const sentence = (parts.shift() || "") + (parts.shift() || "")
              if (sentence.trim()) enqueueSentenceAudio(sentence.trim())
            }
            sentenceBuffer = parts.join("")
          }
        },
        userLocation,
        store.selectedLanguage,
        (toolResults: ToolCallResult[]) => {
          setMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], toolResults, isCallingTool: false }
            }
            return updated
          })
        }
      )

      if (sentenceBuffer.trim()) {
        enqueueSentenceAudio(sentenceBuffer.trim())
      }
    } catch (err) {
      const fallbackMsg = "I can help you explore Great Zimbabwe, Lake Mutirikwi, and local heritage experiences."
      setLiveCallTranscript(fallbackMsg)
      enqueueSentenceAudio(fallbackMsg)
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  async function send(text: string) {
    const q = text.trim()
    if (!q || isLoading) return
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    
    // Check if user request triggers a tool call
    const hasTool = !!detectToolIntent(q, userLocation || undefined)

    // Build chat history for Gemini API context
    const history: ChatHistoryMessage[] = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
    }))

    // Append user message & placeholder AI message
    setMessages((m) => [
      ...m,
      { role: "user", text: q, time: now },
      { role: "ai", text: "...", time: now, isCallingTool: hasTool },
    ])
    setInput("")
    setIsLoading(true)

    try {
      const finalReply = await streamGeminiLiveAI(
        q,
        history,
        (_chunk: string, fullText: string) => {
          setMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], text: fullText }
            }
            return updated
          })
        },
        userLocation,
        store.selectedLanguage,
        (toolResults: ToolCallResult[]) => {
          setMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], toolResults, isCallingTool: false }
            }
            return updated
          })
        }
      )
      // Clear isCallingTool if no tool executed
      if (!hasTool) {
        setMessages((m) => {
          const updated = [...m]
          const lastIdx = updated.length - 1
          if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
            updated[lastIdx] = { ...updated[lastIdx], isCallingTool: false }
          }
          return updated
        })
      }
      if (isLiveCallActive) speakResponse(finalReply)
    } catch (err) {
      setMessages((m) => {
        const updated = [...m]
        const lastIdx = updated.length - 1
        if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
          updated[lastIdx] = { ...updated[lastIdx], text: "I am having trouble connecting to live AI right now. Please try again in a moment.", isCallingTool: false }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
      {/* Left panel: Category triggers + Popular questions */}
      <div className="hidden flex-col gap-4 xl:flex">
        {/* Categories */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <b className="block text-[13.5px] font-bold mb-3">
            What can I help you with?
          </b>
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <button
                  key={c.title}
                  onClick={() => send(`Help me with: ${c.title}`)}
                  className="group flex items-center justify-between rounded-lg p-2 text-left hover:bg-brand-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 group-hover:bg-brand-100">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <b className="block truncate text-[12.5px] font-semibold text-foreground">
                        {c.title}
                      </b>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {c.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-brand-700" />
                </button>
              )
            })}
          </div>
          {/* Live Gemini Thinking Indicator */}
          {isLoading && (
            <div className="flex gap-3 mt-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-900 via-amber-900 to-brand-950 text-amber-300 font-bold shadow-md">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-xl border border-brand-200/80 bg-brand-50/60 px-4 py-3 text-xs text-brand-950 flex items-center gap-2">
                <span className="font-bold">ZimTour AI is querying live dataset...</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              </div>
            </div>
          )}
        </div>

        {/* Popular questions */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <b className="block text-[13.5px] font-bold mb-2.5">
            Popular questions
          </b>
          <div className="flex flex-col gap-1.5">
            {POPULAR_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-lg border border-border/80 bg-background px-3 py-2 text-left text-[12px] font-medium text-foreground transition-colors hover:border-brand-600 hover:bg-brand-50 hover:text-brand-800"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Chat top header inside container */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-brand-50">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <b className="text-[14px] text-foreground">Hello Tawanda! 👋</b>
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                I&apos;m here to help you discover the best of Zimbabwe.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1 text-[12px] font-semibold text-foreground transition hover:bg-muted">
              <Globe className="h-3.5 w-3.5 text-brand-600 shrink-0" />
              <select
                value={store.selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-transparent font-semibold text-foreground outline-none cursor-pointer text-xs pr-1"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setMessages([
                  {
                    role: "ai",
                    text: "Hi Tawanda! I'm ready for your next question. Where shall we explore?",
                  },
                ])
              }
              className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>
        </div>

        {/* Message scroll area */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className="space-y-3">
              <div
                className={cn(
                  "flex gap-3",
                  m.role === "user" && "flex-row-reverse",
                )}
              >
                {m.role === "ai" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-brand-50 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3c7a5b] text-xs font-bold text-white">
                    T
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-xs relative group",
                    m.role === "ai"
                      ? "bg-muted/60 text-foreground"
                      : "bg-brand-100/70 text-brand-950 font-medium",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p>{m.text}</p>
                    {m.role === "ai" && (
                      <button
                        onClick={() => handlePlayMessageSpeech(i, m.text)}
                        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-background/80 text-muted-foreground hover:bg-brand-100 hover:text-brand-900 transition border border-border/60"
                        title="Listen to Shona AI Voice"
                      >
                        {speakingMsgIdx === i ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {m.time && (
                    <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                      {m.time} ✓✓
                    </span>
                  )}
                </div>
              </div>

              {/* Tool Execution Indicator */}
              {m.isCallingTool && (
                <div className="ml-11 flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50/80 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-xs animate-pulse max-w-fit">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-600" />
                  <span>⚙ Calling ZimTour tool & querying live database...</span>
                </div>
              )}

              {/* Agentic Tool Results (Rich Cards) */}
              {m.toolResults && m.toolResults.length > 0 && (
                <div className="ml-11 space-y-3 max-w-[620px]">
                  {m.toolResults.map((tr, trIdx) => {
                    if (tr.tool === "search_places") {
                      return (
                        <div key={trIdx} className="rounded-2xl border border-border/80 bg-background/50 p-3 space-y-2.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-brand-600" />
                              ZimTour Verified Listings ({tr.results.length})
                            </span>
                            <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                              Local API Data
                            </span>
                          </div>
                          {tr.results.map((place) => (
                            <div
                              key={place.id}
                              onClick={() => onNavigate("listing")}
                              className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-border bg-card p-3 cursor-pointer shadow-xs transition hover:shadow-md hover:border-brand-600"
                            >
                              <div
                                className="h-[90px] w-full sm:w-[110px] shrink-0 rounded-lg bg-cover bg-center"
                                style={{ backgroundImage: `url('${place.imageUrl || img(place.seed || "g1")}')` }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-[13.5px] font-bold text-foreground group-hover:text-brand-700 truncate">
                                    {place.name}
                                  </h4>
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 shrink-0">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    {place.rating} ({place.reviews})
                                  </div>
                                </div>
                                <p className="line-clamp-2 text-[11.5px] text-muted-foreground mt-0.5">
                                  {place.desc}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-semibold text-brand-700">{place.entryPrice}</span>
                                    <span>·</span>
                                    <span>{place.category}</span>
                                    {place.distanceKm !== undefined && (
                                      <>
                                        <span>·</span>
                                        <span className="font-bold text-emerald-700">{place.distanceKm} km away</span>
                                      </>
                                    )}
                                  </div>
                                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                    ♿ {place.accessibility.mobility}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    if (tr.tool === "get_cultural_stories") {
                      return (
                        <div key={trIdx} className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3 space-y-2.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Landmark className="h-3.5 w-3.5 text-amber-600" />
                              Indigenous Oral History & Folklore ({tr.results.length})
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              Audio & Video Recordings
                            </span>
                          </div>
                          {tr.results.map((story) => (
                            <div key={story.id} className="rounded-xl border border-amber-200/70 bg-card p-3 shadow-xs space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-[13.5px] font-bold text-foreground">{story.title}</h4>
                                  <p className="text-[11px] font-medium text-amber-800">
                                    Recounted by elder {story.storyteller} · {story.placeName}
                                  </p>
                                </div>
                                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 shrink-0">
                                  {story.language}
                                </span>
                              </div>
                              <p className="text-[12px] text-muted-foreground italic bg-muted/30 p-2.5 rounded-lg border border-border/50">
                                "{story.transcript}"
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    {story.duration}
                                  </span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                    ✓ ZTA Verified Story
                                  </span>
                                </div>
                                <button
                                  onClick={() => speakResponse(story.transcript)}
                                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 shadow-xs transition"
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                  Listen to Audio
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    if (tr.tool === "place_booking") {
                      const b = tr.result
                      return (
                        <div key={trIdx} className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-card to-background p-4 shadow-md space-y-3">
                          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-5 w-5 text-emerald-600" />
                              <span className="text-[13px] font-extrabold text-emerald-950 uppercase tracking-wider">
                                Booking Confirmed
                              </span>
                            </div>
                            <span className="rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px] px-3 py-0.5">
                              {b.confirmationCode}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[12px]">
                            <div>
                              <span className="text-muted-foreground block text-[10.5px]">Destination/Service:</span>
                              <strong className="text-foreground font-bold">{b.placeName}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10.5px]">Tourist:</span>
                              <strong className="text-foreground font-bold">{b.touristName}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10.5px]">Date:</span>
                              <strong className="text-foreground font-bold">{b.bookingDate}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10.5px]">Guests:</span>
                              <strong className="text-foreground font-bold">{b.guests} Person(s)</strong>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-emerald-200 pt-2.5">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Total Amount Paid ({b.paymentMethod}):</span>
                              <span className="text-sm font-black text-emerald-700">${b.totalAmountUSD} USD</span>
                            </div>
                            <span className="rounded-lg bg-emerald-100 border border-emerald-300 px-3 py-1 text-[11px] font-bold text-emerald-900">
                              ✓ Paid via {b.paymentMethod}
                            </span>
                          </div>
                        </div>
                      )
                    }

                    if (tr.tool === "get_place_details") {
                      const p = tr.result
                      return (
                        <div key={trIdx} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                          <div
                            className="h-[140px] w-full rounded-xl bg-cover bg-center"
                            style={{ backgroundImage: `url('${p.imageUrl || img(p.seed || "g1")}')` }}
                          />
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-black text-foreground">{p.name}</h3>
                              <p className="text-xs font-semibold text-brand-700">{p.category} · {p.subCategory}</p>
                            </div>
                            <span className="rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-1 flex items-center gap-1 shrink-0">
                              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              {p.rating}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {p.tags.map((t, tIdx) => (
                              <span key={tIdx} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <span className="text-xs font-bold text-foreground">Entry: {p.entryPrice}</span>
                            <button
                              onClick={() => send(`Book ${p.name}`)}
                              className="rounded-lg bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-3.5 py-1.5 shadow-xs transition"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      )
                    }

                    if (tr.tool === "get_reviews") {
                      return (
                        <div key={trIdx} className="rounded-2xl border border-border bg-card p-3 space-y-2.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Verified Reviews for {tr.placeName} ({tr.results.length})
                            </span>
                          </div>
                          {tr.results.map((rev) => (
                            <div key={rev.id} className="rounded-xl border border-border/70 bg-muted/20 p-2.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-white text-[10px] font-bold">
                                    {rev.avatar}
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{rev.author}</span>
                                  {rev.verified && (
                                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                      <ShieldCheck className="h-3 w-3" /> Verified
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 text-amber-500">
                                  {Array.from({ length: rev.rating }).map((_, rIdx) => (
                                    <Star key={rIdx} className="h-3 w-3 fill-amber-500" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground pl-8">"{rev.comment}"</p>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              )}

              {/* Rich Experience Recommendations inside AI response */}
              {m.experiences && (
                <div className="ml-11 flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-background/50 p-3 max-w-[620px]">
                  {m.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      onClick={() => onNavigate("listing")}
                      className="group flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-border bg-card p-2.5 cursor-pointer shadow-xs transition hover:shadow-md hover:border-brand-600"
                    >
                      <div
                        className="h-[80px] w-full sm:w-[100px] shrink-0 rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url('${img(exp.seed)}')` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-[13.5px] font-bold text-foreground group-hover:text-brand-700 truncate">
                            {exp.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                            {exp.distance}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11.5px] text-muted-foreground mt-0.5">
                          {exp.desc}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exp.duration}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {exp.group}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              exp.tagType === "available"
                                ? "bg-brand-50 text-brand-700"
                                : "bg-blue-50 text-blue-700",
                            )}
                          >
                            {exp.tag}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-700 shrink-0 hidden sm:block" />
                    </div>
                  ))}

                  <button
                    onClick={() => onNavigate("explore")}
                    className="w-full rounded-lg bg-muted py-2 text-center text-[12px] font-bold text-foreground hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    View all nearby experiences
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Live Gemini Thinking Indicator inside chat stream */}
          {isLoading && (
            <div className="flex gap-3 my-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-900 via-amber-900 to-brand-950 text-amber-300 font-bold shadow-md">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-xl border border-brand-200/80 bg-brand-50/80 px-4 py-3 text-xs text-brand-950 flex items-center gap-2 shadow-xs">
                <span className="font-bold">ZimTour AI is querying live dataset...</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              </div>
            </div>
          )}

          {/* Quick Suggestion Pills */}
          <div className="pt-2 flex flex-wrap gap-2 pl-11">
            {[
              "Make it a half-day itinerary",
              "What's the local food like?",
              "How do I get there?",
              "Tell me more about this place",
            ].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-input bg-card px-3.5 py-1.5 text-[12px] font-medium text-foreground transition hover:border-brand-600 hover:bg-brand-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-border p-3.5 bg-card">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background p-2 shadow-xs">
            <button className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Attach photo</span>
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  send(input)
                }
              }}
              placeholder={isRecording ? "Listening to Shona speech..." : isTranscribing ? "Transcribing speech..." : "Ask me anything about your trip..."}
              className="flex-1 min-w-0 bg-transparent px-2 text-[13.5px] outline-none placeholder:text-muted-foreground"
            />

            <button
              onClick={toggleMicRecording}
              disabled={isTranscribing}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition",
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : isTranscribing
                  ? "bg-amber-500 text-white"
                  : "text-amber-600 hover:bg-amber-100 hover:text-amber-700",
              )}
              title="Speak in Shona / English (Shona Whisper STT)"
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => send(input)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-white transition hover:bg-brand-800"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 text-center text-[10.5px] text-muted-foreground">
            AI can make mistakes. Please verify important information.
          </div>
        </div>
      </div>

    </div>
  )
}
