export const NLLB_LANG_CODES: Record<string, string> = {
  en: "eng_Latn",
  english: "eng_Latn",
  sn: "sna_Latn",
  shona: "sna_Latn",
  nd: "zul_Latn",
  ndebele: "zul_Latn",
  fr: "fra_Latn",
  french: "fra_Latn",
  de: "deu_Latn",
  german: "deu_Latn",
  es: "spa_Latn",
  spanish: "spa_Latn",
  zh: "zho_Hans",
  mandarin: "zho_Hans",
}


export function toNllbCode(key: string): string {
  if (!key) return "sna_Latn"
  const normalized = key.toLowerCase().trim()
  const code = NLLB_LANG_CODES[normalized]
  if (!code) {
    // If already in NLLB format or unmapped, return as-is or fallback to sna_Latn
    if (key.includes("_")) return key
    console.warn(`No NLLB code mapped for language: ${key}, defaulting to sna_Latn`)
    return "sna_Latn"
  }
  return code
}

/** Check if TTS voice synthesis (F5-TTS) is natively supported for target language */
export function isF5TtsSupported(targetLangKey: string): boolean {
  const code = toNllbCode(targetLangKey)
  return code === "sna_Latn" || code === "eng_Latn"
}

