"use client"
import { useCallback, useRef, useState } from "react"
import { speakTranslatedGapless } from "@/lib/shona-speech"
import { toNllbCode, isF5TtsSupported } from "@/lib/nllbLangCodes"

const DEBOUNCE_MS = 2000

export interface UseShonaTranslateOptions {
  sourceLang?: string
  targetLang?: string
}

export function useShonaTranslate(options: UseShonaTranslateOptions = {}) {
  const { sourceLang = "en", targetLang = "sn" } = options

  const [text, setTextState] = useState("")
  const [translation, setTranslation] = useState("")
  const [speakBack, setSpeakBack] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopSpeakRef = useRef<(() => void) | null>(null)

  const runTranslate = useCallback(
    async (input?: string, src = sourceLang, tgt = targetLang) => {
      // Cancel any pending debounced translation timer to prevent duplicate runs
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      const textToTranslate = typeof input === "string" ? input : text
      const trimmed = textToTranslate.trim()
      if (!trimmed) {
        setTranslation("")
        return
      }

      setError(null)
      setIsTranslating(true)

      const targetNllbCode = toNllbCode(tgt)
      const sourceNllbCode = toNllbCode(src)

      try {
        // Voice streaming playback is supported natively when target is Shona
        if (speakBack && isF5TtsSupported(tgt)) {
          // Stop any active streaming playback before launching a new synthesis session
          stopSpeaking()
          setIsSpeaking(true)
          const { stop } = await speakTranslatedGapless(trimmed, {
            sourceLang: sourceNllbCode,
            targetLang: targetNllbCode,
            onTranslation: setTranslation,
            onComplete: () => setIsSpeaking(false),
            onError: (err) => {
              setError(err.message)
              setIsSpeaking(false)
            },
          })
          stopSpeakRef.current = stop
        } else {

          // Standard NLLB text-only translation API
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: trimmed,
              source_lang: sourceNllbCode,
              target_lang: targetNllbCode,
            }),
          })
          if (!res.ok) {
            const errText = await res.text()
            throw new Error(errText || "Translation request failed")
          }
          const data = await res.json()
          setTranslation(data.translated_text || data.text || "")

          if (speakBack && !isF5TtsSupported(tgt)) {
            setError("Note: F5-TTS voice synthesis engine currently streams Shona (ChiShona) audio.")
          }
        }
      } catch (err: any) {
        setError(err?.message ?? "Translation failed")
      } finally {
        setIsTranslating(false)
      }
    },
    [speakBack, sourceLang, targetLang]
  )

  // Called on every keystroke — only fires 2s after typing stops.
  const setText = useCallback(
    (value: string) => {
      setTextState(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (value.trim()) {
        debounceRef.current = setTimeout(() => runTranslate(value), DEBOUNCE_MS)
      } else {
        setTranslation("")
      }
    },
    [runTranslate]
  )

  // Explicit button click — cancels pending debounce and translates immediately.
  const translateNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    runTranslate(text)
  }, [text, runTranslate])

  const stopSpeaking = useCallback(() => {
    stopSpeakRef.current?.()
    setIsSpeaking(false)
  }, [])

  return {
    text,
    setText,
    translation,
    setTranslation,
    error,
    speakBack,
    setSpeakBack,
    isTranslating,
    isSpeaking,
    translateNow,
    stopSpeaking,
    runTranslate,
  }

}
