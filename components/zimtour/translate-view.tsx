"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Globe,
  ExternalLink,
  Languages,
  Mic,
  Volume2,
  Copy,
  Check,
  ArrowRightLeft,
  Sparkles,
  BookOpen,
  Square,
  Loader2,
  Radio,
  AudioWaveform,
} from "lucide-react"
import {
  transcribeAudio,
  synthesizeSpeech,
  playAudioBuffer,
  startMicRecording,
  translateText,
  speakTranslatedGapless,
  GaplessSpeechPlayer,
  getSharedSpeechPlayer,
  type RecorderHandle,
} from "@/lib/shona-speech"
import { useShonaTranslate } from "@/hooks/useShonaTranslate"

const LANGUAGES = [
  { code: "en", name: "English 🇬🇧" },
  { code: "sn", name: "Shona (ChiShona) 🇿🇼" },
  { code: "nd", name: "Ndebele (IsiNdebele) 🇿🇼" },
  { code: "fr", name: "French 🇫🇷" },
  { code: "de", name: "German 🇩🇪" },
  { code: "es", name: "Spanish 🇪🇸" },
  { code: "zh", name: "Mandarin 🇨🇳" },
]


const QUICK_PHRASES = [
  { category: "Greetings", english: "Hello, how are you?", shona: "Mhoro, makadii?", ndebele: "Salibonani, linjani?" },
  { category: "Gratitude", english: "Thank you very much", shona: "Ndatenda zvikuru", ndebele: "Ngiyabonga kakhulu" },
  { category: "Directions", english: "Where is Great Zimbabwe?", shona: "Dzimbahwe re Great Zimbabwe riri kupi?", ndebele: "Ingaba i-Great Zimbabwe ingaphi?" },
  { category: "Hospitality", english: "Where can I find authentic local food?", shona: "Ndingawana kupi zvekudya zvechivanhu?", ndebele: "Ngingazithola ngaphi ukudla kwekhaya?" },
  { category: "Shopping", english: "How much is this?", shona: "Ichi chinodhura zvakadini?", ndebele: "Kubiza malini lokhu?" },
]

const DICTIONARY: Record<string, { shona: string; ndebele: string }> = {
  hello: { shona: "Mhoro", ndebele: "Salibonani" },
  thanks: { shona: "Ndatenda", ndebele: "Ngiyabonga" },
  "thank you": { shona: "Ndatenda zvikuru", ndebele: "Ngiyabonga kakhulu" },
  water: { shona: "Mvura", ndebele: "Manzi" },
  food: { shona: "Zvekudya", ndebele: "Ukudla" },
  where: { shona: "Kupi", ndebele: "Ngaphi" },
  good: { shona: "Zvakanaka", ndebele: "Kuhle" },
  welcome: { shona: "Tigamuchire", ndebele: "Wamukelekile" },
}

export function TranslateView() {
  const [sourceLang, setSourceLang] = useState("en")
  const [targetLang, setTargetLang] = useState("sn")
  const [copied, setCopied] = useState(false)

  // Shona STT state
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recorderRef = useRef<RecorderHandle | null>(null)
  const [sttError, setSttError] = useState("")

  // Single TTS state
  const [isSpeakingSingle, setIsSpeakingSingle] = useState(false)
  const stopAudioRef = useRef<(() => void) | null>(null)

  // Hook for 2s debounced translation, speakBack toggle, streaming voice, error management
  const {
    text: inputText,
    setText: setInputText,
    translation: translatedText,
    setTranslation,
    error: translateError,
    speakBack,
    setSpeakBack,
    isTranslating,
    isSpeaking: isStreamingSpeak,
    translateNow,
    stopSpeaking: stopStreamSpeak,
    runTranslate,
  } = useShonaTranslate({ sourceLang, targetLang })

  // Web Speech API state (for non-Shona/Ndebele languages)
  const [isWebSpeechListening, setIsWebSpeechListening] = useState(false)
  const speechRecognitionRef = useRef<any>(null)

  const stopWebSpeech = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch {}
      speechRecognitionRef.current = null
    }
    setIsWebSpeechListening(false)
  }, [])

  const startWebSpeech = useCallback(() => {
    setSttError("")
    setTranslation("")
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSttError("Web Speech API is not supported in this browser.")
      return
    }

    try {
      const recognition = new SpeechRecognition()
      speechRecognitionRef.current = recognition

      const bcpMap: Record<string, string> = {
        en: "en-US",
        sn: "sn-ZW",
        nd: "nd-ZW",
        fr: "fr-FR",
        de: "de-DE",
        es: "es-ES",
        zh: "zh-CN",
      }

      recognition.lang = bcpMap[sourceLang] || sourceLang
      recognition.continuous = false
      recognition.interimResults = true

      let finalTranscript = ""

      recognition.onstart = () => {
        setIsWebSpeechListening(true)
        setTranslation("")
      }

      recognition.onresult = (event: any) => {
        let interim = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interim += transcript
          }
        }
        const currentText = (finalTranscript + interim).trim()
        if (currentText) {
          setInputText(currentText)
          setTranslation("")
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("[WebSpeech] Error:", event.error)
        if (event.error !== "no-speech") {
          setSttError(`Speech recognition error: ${event.error}`)
        }
        setIsWebSpeechListening(false)
      }

      recognition.onend = () => {
        setIsWebSpeechListening(false)
        speechRecognitionRef.current = null
        // Trigger translation instantly on pause / end of speech!
        const completeText = finalTranscript.trim()
        if (completeText) {
          runTranslate(completeText)
        }
      }

      recognition.start()
    } catch (err: any) {
      setSttError(err?.message || "Failed to start speech recognition")
      setIsWebSpeechListening(false)
    }
  }, [sourceLang, setInputText, setTranslation, runTranslate])

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopAudioRef.current?.()
      stopStreamSpeak()
      stopWebSpeech()
    }
  }, [stopStreamSpeak, stopWebSpeech])

  function swapLanguages() {
    const nextSrc = targetLang
    const nextTgt = sourceLang
    setSourceLang(nextSrc)
    setTargetLang(nextTgt)
    if (translatedText.trim()) {
      setInputText(translatedText)
    }
  }

  // ── STT Handler: Modal Shona STT for sn/nd, Web Speech API for others ──

  const handleMicToggle = useCallback(async () => {
    setSttError("")
    const isModalSttLang = sourceLang === "sn" || sourceLang === "nd"

    if (!isModalSttLang) {
      if (isWebSpeechListening) {
        stopWebSpeech()
      } else {
        startWebSpeech()
      }
      return
    }

    setTranslation("")

    if (isRecording && recorderRef.current) {
      setIsRecording(false)
      setIsTranscribing(true)
      try {
        const blob = await recorderRef.current.stop()
        recorderRef.current = null
        const text = await transcribeAudio(blob)
        if (text) {
          setInputText(text)
          runTranslate(text)
        }
      } catch (err: any) {
        setSttError(err?.message || "Transcription failed")
      } finally {
        setIsTranscribing(false)
      }
      return
    }

    try {
      const handle = await startMicRecording()
      recorderRef.current = handle
      setIsRecording(true)

    } catch (err: any) {
      setSttError(err?.message || "Mic access denied")
    }
  }, [sourceLang, isWebSpeechListening, stopWebSpeech, startWebSpeech, isRecording, setInputText, translateNow])


  // ── Standard Single TTS ──

  const handleShonaSpeak = useCallback(async (text: string) => {
    if (!text || isSpeakingSingle || isStreamingSpeak) return

    if (targetLang !== "sn") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = targetLang === "nd" ? "en-ZA" : targetLang
        window.speechSynthesis.speak(u)
      }
      return
    }

    setIsSpeakingSingle(true)
    try {
      const buffer = await synthesizeSpeech(text)
      stopAudioRef.current = playAudioBuffer(buffer, () => setIsSpeakingSingle(false))
    } catch (err) {
      console.error("[Shona TTS] Failed:", err)
      setSttError(err instanceof Error ? err.message : "TTS failed")
      setIsSpeakingSingle(false)
    }
  }, [targetLang, isSpeakingSingle, isStreamingSpeak])

  function speakSource(text: string) {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = sourceLang === "sn" || sourceLang === "nd" ? "en-ZA" : sourceLang
    window.speechSynthesis.speak(u)
  }

  function copyToClipboard() {
    if (!translatedText) return
    navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openGoogleTranslateWebview() {
    const encodedText = encodeURIComponent(inputText || "Hello")
    const googleUrl = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodedText}&op=translate`
    window.open(googleUrl, "_blank", "width=800,height=600,scrollbars=yes")
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 via-amber-900 to-brand-950 text-amber-300 font-black text-xl shadow-md">
            <Languages className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-foreground">
                ZimTour Tourist Translator
              </h2>
              <span className="rounded-full bg-emerald-400/20 text-emerald-800 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse text-emerald-600" />
                Gapless Shona Voice Pipeline
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Modal Unified NLLB + Sentence SSE Stream + Web Audio Gapless Synthesis
            </p>
          </div>
        </div>

        <button
          onClick={openGoogleTranslateWebview}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-900 to-brand-800 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:brightness-110 transition active:scale-95 shrink-0"
        >
          <Globe className="h-4 w-4 text-amber-300" />
          <span>Launch Google Translate Web</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>

      {/* Main Translator Box */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Language Selection Header & Speak Back Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer hover:border-brand-400"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>

            <button
              onClick={swapLanguages}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-input bg-card text-muted-foreground hover:bg-brand-50 hover:text-brand-700 transition"
              title="Swap Languages"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer hover:border-brand-400"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Speak Back Toggle Switch */}
          <label className="flex items-center gap-2 text-xs font-extrabold text-foreground cursor-pointer bg-background/80 border border-border rounded-xl px-3 py-1.5 shadow-2xs hover:border-brand-400 transition">
            <input
              type="checkbox"
              checked={speakBack}
              onChange={(e) => {
                const checked = e.target.checked
                setSpeakBack(checked)
                if (checked) {
                  getSharedSpeechPlayer().primeFromGesture()
                }
              }}
              className="h-4 w-4 rounded accent-brand-900 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-amber-600" />
              Speak back automatically
            </span>
          </label>
        </div>

        {/* Dual Input/Output Text Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border min-h-[220px]">
          {/* Source Input */}
          <div className="flex flex-col p-4 space-y-3 bg-background/50">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or speak phrases to translate (translates after 2s pause or click Translate)..."
              className="flex-1 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[140px]"
            />

            {(sttError || translateError) && (
              <p className="text-[11px] text-red-600 font-semibold">{sttError || translateError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
              {(() => {
                const isModalSttLang = sourceLang === "sn" || sourceLang === "nd"
                const isActiveRecording = isRecording || isWebSpeechListening
                return (
                  <button
                    onClick={handleMicToggle}
                    disabled={isTranscribing}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isActiveRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : isTranscribing
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    {isTranscribing ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing...</>
                    ) : isWebSpeechListening ? (
                      <><Square className="h-3.5 w-3.5" /> Listening (Web Speech)...</>
                    ) : isRecording ? (
                      <><Square className="h-3.5 w-3.5" /> Stop Recording</>
                    ) : (
                      <><Mic className="h-3.5 w-3.5" /> {isModalSttLang ? "Shona Voice Input" : "Speech Input"}</>
                    )}
                  </button>
                )
              })()}


              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakSource(inputText)}
                  disabled={!inputText}
                  className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Listen
                </button>

                <button
                  onClick={translateNow}
                  disabled={isTranslating || !inputText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-40 transition"
                >
                  {isTranslating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Translating...</>
                  ) : (
                    "Translate Now"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Target Output */}
          <div className="flex flex-col p-4 space-y-3 bg-brand-50/20 relative">
            {isTranslating && (
              <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] text-brand-700 font-semibold bg-brand-100/60 px-2 py-0.5 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" /> Modal NLLB Translating...
              </div>
            )}

            {isStreamingSpeak && (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded-xl px-3 py-1.5 text-xs font-bold animate-pulse">
                <div className="flex items-center gap-2">
                  <AudioWaveform className="h-4 w-4 text-amber-600 animate-bounce" />
                  <span>Gapless Speech Streaming & Playing...</span>
                </div>
                <button
                  onClick={stopStreamSpeak}
                  className="text-xs text-red-700 underline font-bold hover:text-red-900"
                >
                  Stop
                </button>
              </div>
            )}

            <div className="flex-1 w-full text-sm font-semibold text-foreground min-h-[140px] whitespace-pre-wrap">
              {translatedText ? (
                translatedText
              ) : (
                <span className="text-muted-foreground font-normal italic">
                  Translation will appear here...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
              <button
                onClick={copyToClipboard}
                disabled={!translatedText}
                className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>

              <div className="flex items-center gap-2">
                {/* Single Buffered Voice Button */}
                <button
                  onClick={() => handleShonaSpeak(translatedText)}
                  disabled={!translatedText || isSpeakingSingle || isStreamingSpeak}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                    isSpeakingSingle
                      ? "bg-amber-600 text-white"
                      : "bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-40"
                  }`}
                >
                  {isSpeakingSingle ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Speaking...</>
                  ) : (
                    <><Volume2 className="h-3.5 w-3.5" /> {targetLang === "sn" ? "Shona Voice" : "Pronounce"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zimbabwean Essential Phrasebook Section */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-700" />
            <h3 className="text-sm font-extrabold text-foreground">
              Essential Tourist Phrasebook (Shona & Ndebele)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">Click any phrase to translate & speak</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_PHRASES.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(item.english)
                translateNow()
              }}
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-background p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/50 group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="rounded bg-brand-100 px-2 py-0.5 text-[9.5px] font-extrabold text-brand-900 uppercase">
                  {item.category}
                </span>
                <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <span className="text-[13px] font-bold text-foreground mt-1">"{item.english}"</span>
              <div className="text-[11.5px] text-brand-900 font-semibold">🇿🇼 Shona: {item.shona}</div>
              <div className="text-[11px] text-emerald-900 font-medium">🇿🇼 Ndebele: {item.ndebele}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
