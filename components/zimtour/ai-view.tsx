"use client"

import { useEffect, useRef, useState } from "react"
import {
  transcribeAudio,
  speakTextByLanguage,
  startMicRecording,
  type RecorderHandle,
} from "@/lib/shona-speech"
import {
  Bot,
  Sparkles,
  MapPin,
  Mic,
  Paperclip,
  RotateCcw,
  Compass,
  Calendar,
  Landmark,
  ShieldCheck,
  Accessibility,
  ShoppingBag,
  ChevronRight,
  Star,
  Clock,
  Users,
  Volume2,
  PhoneCall,
  Phone,
  ArrowUp,
  CheckCheck,
  Sun,
  Square,
  Loader2,
  CalendarCheck2,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { img } from "@/lib/zimtour-data"
import { streamGeminiLiveAI, type ChatHistoryMessage, type UserLocation, type ToolCallResult } from "@/lib/gemini-live-api"
import { useZimTourStore, LANGUAGE_OPTIONS, setSelectedLanguage, setSelectedPlaceId } from "@/lib/zimtour-store"
import type { View } from "./types"
import { ModalVoiceCallDialog } from "./modal-voice-call-dialog"
import { AgentPlanPanel } from "./agent-plan-panel"
import type { PlanStep } from "@/lib/agent-planner"

type Msg = {
  role: "user" | "ai"
  text: string
  time?: string
  ackText?: string
  planSteps?: PlanStep[]
  isMultiStep?: boolean
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

const STORAGE_CHAT_KEY = "zimtour_chat_history_v1"

const CATEGORIES = [
  { icon: Compass, title: "Plan my trip", desc: "Get a personalised itinerary" },
  { icon: Calendar, title: "Things to do", desc: "Find activities and experiences" },
  { icon: Landmark, title: "Cultural Guide", desc: "Learn about heritage & history" },
  { icon: ShieldCheck, title: "Travel tips", desc: "Visa, safety, weather and more" },
  { icon: Accessibility, title: "Accessibility help", desc: "Find accessible places & services" },
  { icon: ShoppingBag, title: "Local services", desc: "Transport, dining, shopping & more" },
]

const INITIAL_EXPERIENCES = [
  {
    id: "cultural-exp",
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
    id: "lake-mutirikwi",
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
    id: "tugwi-mukosi",
    name: "Tugwi–Mukosi Dam & Ruins",
    distance: "28 km",
    desc: "Ancient city ruins with rich Shona history, combined with Zimbabwe's largest inland dam reservoir.",
    tag: "Available today",
    tagType: "available" as const,
    seed: "tugwimukosi",
    duration: "2–3 hrs",
    group: "Easy hike",
  },
]

const DEFAULT_WELCOME_MESSAGES: Msg[] = [
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
]

export function AIView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const store = useZimTourStore()
  
  // ── CHAT PERSISTENCE STATE ──
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_CHAT_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (err) {
        console.warn("Failed to restore chat history from localStorage:", err)
      }
    }
    return DEFAULT_WELCOME_MESSAGES
  })

  // Persist messages whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages))
      } catch (err) {
        console.warn("Failed to persist chat history to localStorage:", err)
      }
    }
  }, [messages])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isModalCallOpen, setIsModalCallOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // ── GPS LOCATION STATE ──
  const [userLocation, setUserLocation] = useState<UserLocation>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [])

  // ── Shona & Puter TTS State ──
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recorderRef = useRef<RecorderHandle | null>(null)
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null)
  const stopAudioRef = useRef<(() => void) | null>(null)

  async function speakResponse(text: string) {
    try {
      if (stopAudioRef.current) stopAudioRef.current()
      stopAudioRef.current = await speakTextByLanguage(text, store.selectedLanguage, () => {})
    } catch (err) {
      console.warn("TTS playback failed:", err)
    }
  }

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  // Helper to open real place listing by ID
  function handleGoToListing(placeId: string) {
    if (!placeId) return
    setSelectedPlaceId(placeId)
    onNavigate("listing")
  }

  function handleNewChat() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_CHAT_KEY)
      } catch (e) {}
    }
    setMessages([
      {
        role: "ai",
        text: "Hi Tawanda! I'm ready for your next question. Where shall we explore?",
      },
    ])
  }

  async function send(text: string) {
    const q = text.trim()
    if (!q || isLoading) return
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const history: ChatHistoryMessage[] = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      text: m.text,
    }))

    setMessages((m) => [
      ...m,
      { role: "user", text: q, time: now },
      { role: "ai", text: "", time: now },
    ])
    setInput("")
    setIsLoading(true)

    try {
      await streamGeminiLiveAI(
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
              updated[lastIdx] = { ...updated[lastIdx], toolResults }
            }
            return updated
          })
        },
        "tawanda",
        (steps: PlanStep[], isMulti: boolean) => {
          setMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], planSteps: steps, isMultiStep: isMulti }
            }
            return updated
          })
        },
        (ackText: string) => {
          setMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], ackText }
            }
            return updated
          })
        }
      )
    } catch (err) {
      setMessages((m) => {
        const updated = [...m]
        const lastIdx = updated.length - 1
        if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
          updated[lastIdx] = { ...updated[lastIdx], text: "I am having trouble connecting to live AI right now. Please try again in a moment." }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-white select-none">
      {/* Workspace Left Panel (Curated Prompts & Services) */}
      <section className="hidden lg:flex w-80 border-r border-slate-200/80 bg-slate-50/60 p-5 overflow-y-auto flex-col gap-6 shrink-0" data-purpose="service-navigator">
        {/* Category: What can I help you with? */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3 flex items-center justify-between">
            <span>What can I help you with?</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </h2>
          <div className="space-y-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <button
                  key={c.title}
                  onClick={() => send(`Help me with: ${c.title}`)}
                  className="w-full text-left p-3 rounded-xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900">
                        {c.title}
                      </h3>
                      <p className="text-[11px] text-slate-500">{c.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </button>
              )
            })}
          </div>
          {/* Live Gemini Thinking Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold shadow-2xs animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Querying live ZimTour intelligence...</span>
            </div>
          )}
        </div>
      </section>

      {/* Workspace Right Panel (Chat Feed & Input) */}
      <section className="flex-1 flex flex-col h-full bg-[#f8fafc] relative overflow-hidden" data-purpose="chat-feed-container">
        {/* Chat Context Header Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Hello Tawanda! 👋</p>
              <p className="text-[11px] text-slate-500">I'm here to help you discover the best of Zimbabwe.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language dropdown in chat context */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition">
              <span className="text-xs">🌐 🇿🇼</span>
              <select
                value={store.selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer text-xs pr-1"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Voice Call Button */}
            <button
              onClick={() => setIsModalCallOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-900/10 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
              <span>AI Voice Call</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>New chat</span>
            </button>
          </div>
        </div>

        {/* Chat Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6" data-purpose="chat-messages-flow">
          {messages.map((m, i) => (
            <div key={i} className="space-y-4">
              {m.role === "user" ? (
                /* User Message */
                <div className="flex flex-col items-end gap-1 max-w-xl ml-auto">
                  <div className="flex items-end gap-2">
                    <div className="bg-slate-900 text-white text-xs md:text-sm font-normal py-3 px-4 rounded-2xl rounded-tr-sm shadow-xs leading-relaxed">
                      {m.text}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-semibold text-[11px] flex items-center justify-center shrink-0">
                      T
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-9">
                    <span>{m.time || "Just now"}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
              ) : (
                /* Bot Message Response */
                <div className="flex items-start gap-3 max-w-3xl">
                  {/* Bot Avatar */}
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  {/* Bot Content Area */}
                  <div className="flex-1 space-y-3">
                    {/* Instant Acknowledgment / Thinking Pill */}
                    {isLoading && i === messages.length - 1 && !m.text && (!m.planSteps || m.planSteps.length === 0) ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-50/90 border border-emerald-300/80 px-4 py-2 rounded-2xl text-xs font-bold text-emerald-900 shadow-2xs animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        <span>Thinking…</span>
                      </div>
                    ) : m.ackText ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-900 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{m.ackText}</span>
                      </div>
                    ) : null}

                    {/* Agent Plan Panel (compact single-line or multi-step stepper) */}
                    {m.planSteps && m.planSteps.length > 0 && (
                      <AgentPlanPanel steps={m.planSteps} compact={!m.isMultiStep} />
                    )}

                    {/* Main Streamed Response Bubble */}
                    {m.text && (
                      <div className="inline-flex items-center gap-2 bg-white border border-slate-200/90 py-2.5 px-4 rounded-2xl rounded-tl-sm text-xs md:text-sm text-slate-800 shadow-2xs leading-relaxed">
                        <span>{m.text}</span>
                        <button
                          onClick={() => handlePlayMessageSpeech(i, m.text)}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                          title="Listen to response"
                        >
                          {speakingMsgIdx === i ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Agentic Tool Results */}
                    {m.toolResults && m.toolResults.length > 0 && (
                      <div className="space-y-3 max-w-2xl">
                        {m.toolResults.map((tr, trIdx) => {
                          if (tr.tool === "search_places") {
                            return (
                              <div key={trIdx} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                    Verified Places ({tr.results.length})
                                  </span>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                    Local Data
                                  </span>
                                </div>
                                {tr.results.map((place) => (
                                  <div
                                    key={place.id}
                                    onClick={() => handleGoToListing(place.id)}
                                    className="group flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer shadow-2xs hover:shadow-md hover:border-emerald-400 transition"
                                  >
                                    <div
                                      className="h-20 w-full sm:w-28 shrink-0 rounded-lg bg-cover bg-center"
                                      style={{ backgroundImage: `url('${place.imageUrl || img(place.seed || "g1")}')` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                          {place.name}
                                        </h4>
                                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 shrink-0">
                                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                          {place.rating}
                                        </span>
                                      </div>
                                      <p className="line-clamp-2 text-xs text-slate-500 mt-1">
                                        {place.desc}
                                      </p>
                                    </div>
                                    <div className="hidden sm:flex text-slate-300 group-hover:text-emerald-600 transition-colors pl-1">
                                      <ChevronRight className="w-5 h-5" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          }

                          if (tr.tool === "get_place_details") {
                            const p = tr.result
                            return (
                              <div
                                key={trIdx}
                                onClick={() => handleGoToListing(p.id)}
                                className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 shadow-2xs hover:border-emerald-400 cursor-pointer transition group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-emerald-700" />
                                    Destination Details
                                  </span>
                                  <span className="text-xs text-emerald-700 font-semibold group-hover:underline flex items-center gap-1">
                                    View full page <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 items-center">
                                  <div
                                    className="h-20 w-full sm:w-28 shrink-0 rounded-lg bg-cover bg-center"
                                    style={{ backgroundImage: `url('${p.imageUrl || img(p.seed)}')` }}
                                  />
                                  <div className="flex-1 space-y-1">
                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">{p.name}</h4>
                                    <p className="text-xs text-slate-600 line-clamp-2">{p.desc}</p>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                                      <span>Entry: {p.entryPrice}</span>
                                      <span>•</span>
                                      <span>Rating: ⭐ {p.rating}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          if (tr.tool === "get_cultural_stories") {
                            return (
                              <div key={trIdx} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 space-y-2.5 shadow-2xs">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Landmark className="w-3.5 h-3.5 text-amber-600" />
                                    Oral History & Heritage ({tr.results.length})
                                  </span>
                                </div>
                                {tr.results.map((story) => (
                                  <div key={story.id} className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold text-slate-900">{story.title}</h4>
                                      {story.placeId && (
                                        <button
                                          onClick={() => handleGoToListing(story.placeId)}
                                          className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                                        >
                                          View Place <ExternalLink className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                      "{story.transcript}"
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-[11px] text-slate-500">Elder {story.storyteller}</span>
                                      <button
                                        onClick={() => speakResponse(story.transcript)}
                                        className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1 shadow-xs transition cursor-pointer"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" /> Listen Audio
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
                              <div
                                key={trIdx}
                                onClick={() => handleGoToListing(b.placeId)}
                                className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 space-y-3 shadow-xs hover:border-emerald-400 cursor-pointer transition group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                    <CalendarCheck2 className="w-4 h-4 text-emerald-700" />
                                    Booking Confirmed
                                  </span>
                                  <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                                    #{b.confirmationCode}
                                  </span>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-emerald-200/80 space-y-1.5 text-xs">
                                  <div className="flex justify-between items-center">
                                    <p className="font-bold text-slate-900 group-hover:text-emerald-700">{b.placeName}</p>
                                    <span className="text-[11px] font-semibold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                                      View Listing <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-600 text-[11px]">
                                    <span>Date: {b.bookingDate}</span>
                                    <span>Guests: {b.guests}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-900 font-semibold pt-1 border-t border-slate-100">
                                    <span>Total: ${b.totalAmountUSD} USD</span>
                                    <span className="text-emerald-700">{b.paymentMethod}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          if (tr.tool === "get_reviews") {
                            return (
                              <div key={trIdx} className="rounded-2xl border border-blue-200 bg-blue-50/40 p-3 space-y-2.5 shadow-2xs">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                    Visitor Reviews for {tr.placeName} ({tr.results.length})
                                  </span>
                                  <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                    Verified
                                  </span>
                                </div>
                                {tr.results.map((review) => (
                                  <div key={review.id} className="rounded-xl border border-blue-200 bg-white p-3 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                          {review.avatar}
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold text-slate-900">{review.author}</span>
                                          <span className="block text-[10px] text-slate-500">{review.date}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, si) => (
                                          <Star
                                            key={si}
                                            className={`w-3 h-3 ${si < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                      "{review.comment}"
                                    </p>
                                    {review.verified && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCheck className="w-3 h-3" /> Verified Visitor
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          }

                          return null
                        })}
                      </div>
                    )}

                    {/* Recommendation Cards Container */}
                    {m.experiences && (
                      <div className="grid grid-cols-1 gap-3 pt-1">
                        {m.experiences.map((exp) => (
                          <div
                            key={exp.id}
                            onClick={() => handleGoToListing(exp.id)}
                            className="bg-white border border-slate-200 rounded-2xl p-3.5 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col sm:flex-row items-center gap-4 cursor-pointer"
                          >
                            {/* Thumbnail Image */}
                            <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                              <img
                                alt={exp.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                src={img(exp.seed)}
                              />
                            </div>
                            {/* Details */}
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                  {exp.name}
                                </h4>
                                <span className="text-xs font-semibold text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {exp.distance}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {exp.desc}
                              </p>
                              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                                <div className="flex items-center gap-3 text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {exp.duration}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {exp.group}
                                  </span>
                                </div>
                                {exp.tagType === "available" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {exp.tag}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                    <Sun className="w-3 h-3 text-blue-500" /> {exp.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="hidden sm:flex text-slate-300 group-hover:text-emerald-600 transition-colors pl-1">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        ))}

                        {/* Button: View All Nearby Experiences */}
                        <div className="pt-1">
                          <button
                            onClick={() => onNavigate("explore")}
                            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>View all nearby experiences</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Quick Suggestion Pills */}
          <div className="pt-2 flex flex-wrap gap-2 pl-11">
            {[
              "Show me available places near me I can book",
              "Plan a day trip to Lake Mutirikwi and Great Zimbabwe",
              "Tell me the UNESCO oral tradition of Great Zimbabwe",
              "What is authentic local food in Masvingo?",
            ].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-900 transition shadow-2xs cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Bottom Input Container */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0" data-purpose="bottom-chat-input-bar">
          <div className="max-w-4xl mx-auto">
            {/* Main Unified Prompt Bar */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              {/* Attach Photo Button */}
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition shrink-0 cursor-pointer">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Attach photo</span>
              </button>
              {/* Main Text Input */}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    send(input)
                  }
                }}
                placeholder={isRecording ? "Listening to Shona speech..." : isTranscribing ? "Transcribing speech..." : "Ask me anything about your trip..."}
                className="flex-1 bg-transparent border-0 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 px-2"
                type="text"
              />
              {/* Voice Input Mic Button */}
              <button
                onClick={toggleMicRecording}
                disabled={isTranscribing}
                className={cn(
                  "p-2 rounded-xl transition shrink-0 cursor-pointer",
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : isTranscribing
                    ? "bg-amber-500 text-white"
                    : "text-amber-600 hover:text-amber-700 hover:bg-amber-50",
                )}
                title="Voice Input (Shona / English STT)"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              {/* Call AI Button */}
              <button
                onClick={() => setIsModalCallOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call AI</span>
              </button>
              {/* Send Button */}
              <button
                onClick={() => send(input)}
                className="p-2 bg-slate-900 hover:bg-black text-white rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            {/* Disclaimer Text */}
            <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </section>

      {/* Modal Shona AI Voice Call Dialog */}
      <ModalVoiceCallDialog
        isOpen={isModalCallOpen}
        onClose={() => setIsModalCallOpen(false)}
      />
    </div>
  )
}
