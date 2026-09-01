import { Groq } from "groq-sdk"
import { MASTER_DATASET, INDIGENOUS_CULTURAL_STORIES, type PlaceDetail, type IndigenousStory, type BookingRecord, type ReviewItem, apiCreateBooking } from "./zimtour-api"
import type { SupportedLanguage } from "./zimtour-store"

// ── Groq Client Configuration ──
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
const GROQ_MODEL = "openai/gpt-oss-120b"

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

// ── GPS Location Types ──
export type UserLocation = { lat: number; lng: number } | null

/** Haversine distance in km between two GPS points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Get nearby places sorted by real GPS distance */
export function getNearbyPlaces(location: UserLocation, maxKm = 60, limit = 5): (PlaceDetail & { gpsDistanceKm: number })[] {
  if (!location) return []
  return MASTER_DATASET
    .map((p) => ({ ...p, gpsDistanceKm: Math.round(haversineKm(location.lat, location.lng, p.lat, p.lng) * 10) / 10 }))
    .filter((p) => p.gpsDistanceKm <= maxKm)
    .sort((a, b) => a.gpsDistanceKm - b.gpsDistanceKm)
    .slice(0, limit)
}

// ══════════════════════════════════════════════
// ── AGENTIC TOOL CALLING SYSTEM ──
// ══════════════════════════════════════════════

export type ToolCallResult =
  | { tool: "search_places"; results: (PlaceDetail & { computedDistanceKm?: number })[] }
  | { tool: "get_cultural_stories"; results: IndigenousStory[] }
  | { tool: "place_booking"; result: BookingRecord }
  | { tool: "get_place_details"; result: PlaceDetail }
  | { tool: "get_reviews"; placeName: string; results: ReviewItem[] }

/**
 * Detect which tool(s) should be called based on user query keywords.
 * Returns null if no tool is needed — the AI just responds conversationally.
 */
export function detectToolIntent(query: string, location?: UserLocation): { toolName: string; args: Record<string, any> } | null {
  const q = query.toLowerCase().trim()

  // ── Skip simple greetings & conversational chit-chat ──
  const isGreeting = /^(mhoro|salibonani|hi|hello|hey|hola|good\s*morning|good\s*afternoon|good\s*evening|how\s*are\s*you|sup|greetings|thanks?|thank\s*you|ok|okay|cool|bye|goodbye|cheers|ndatenda|tatenda|makadiini|makadii|ndinotenda)/i.test(q)
  const hasActionWord = /(book|find|where|show|place|hotel|lodge|near|close|search|list|what|tour|stay|eat|food|restaurant|heritage|culture|review|story|tradition|car|taxi|transport|hospital|clinic|craft|market|shop|experience|things|guide|service|activity|safari|hike|boat|reserve|can you|available)/i.test(q)

  if (isGreeting && !hasActionWord) {
    return null
  }

  // If no action words at all and short message, skip tools
  if (!hasActionWord && q.split(/\s+/).length < 4) {
    return null
  }

  // ── BOOKING intent (broadened) ──
  if (q.includes("book") || q.includes("reserve") || q.includes("bhodha") || (q.includes("can you") && (q.includes("book") || q.includes("reserv"))) || q.match(/book\s*(me|us|a|for|at)/)) {
    // Check if asking about booking capability vs. actual booking
    if (q.match(/can\s*(you|i|we)\s*book/i) || q.match(/do\s*you\s*book/i) || q.match(/you\s*can\s*book/i) || q.match(/you\s*book/i)) {
      // User is asking "can you book?" — show them closest bookable place to demonstrate
      const place = MASTER_DATASET.find((p) => p.category === "Stay" || p.category === "Experiences" || p.category === "Things to Do") || MASTER_DATASET[0]
      return { toolName: "place_booking", args: { placeId: place.id, isDemoBooking: true } }
    }
    const place = MASTER_DATASET.find((p) => q.includes(p.name.toLowerCase()) || q.includes(p.id))
    if (place) return { toolName: "place_booking", args: { placeId: place.id } }
    for (const p of MASTER_DATASET) {
      const words = p.name.toLowerCase().split(/\s+/)
      if (words.some((w) => w.length > 3 && q.includes(w))) {
        return { toolName: "place_booking", args: { placeId: p.id } }
      }
    }
    // If no specific place mentioned, show top option
    if (q.includes("book")) {
      return { toolName: "search_places", args: { category: "Stay" } }
    }
  }

  // ── CULTURAL STORIES intent ──
  if (q.includes("cultural") || q.includes("oral histor") || q.includes("tradition") || q.includes("storytell") || q.includes("legend") || q.includes("heritage stor") || q.includes("indigenous") || q.includes("svikiro") || q.includes("hungwe") || q.includes("njuzu") || q.includes("mukwerera") || q.includes("folklore") || q.includes("story") || q.includes("stories")) {
    const siteName = q.includes("mutirikwi") || q.includes("lake") ? "Mutirikwi" : "Great Zimbabwe"
    return { toolName: "get_cultural_stories", args: { siteName } }
  }

  // ── REVIEWS intent ──
  if (q.includes("review") || q.includes("rating") || q.includes("feedback") || q.includes("what do people say")) {
    const place = MASTER_DATASET.find((p) => q.includes(p.name.toLowerCase()))
    if (place) return { toolName: "get_reviews", args: { placeId: place.id } }
    for (const p of MASTER_DATASET) {
      const words = p.name.toLowerCase().split(/\s+/)
      if (words.some((w) => w.length > 4 && q.includes(w))) {
        return { toolName: "get_reviews", args: { placeId: p.id } }
      }
    }
    return { toolName: "get_reviews", args: { placeId: MASTER_DATASET[0].id } }
  }

  // ── SPECIFIC PLACE detail intent ──
  if (q.includes("tell me about") || q.includes("details") || q.includes("info about") || q.includes("what is")) {
    const place = MASTER_DATASET.find((p) => q.includes(p.name.toLowerCase()))
    if (place) return { toolName: "get_place_details", args: { placeId: place.id } }
    for (const p of MASTER_DATASET) {
      const words = p.name.toLowerCase().split(/\s+/)
      if (words.filter((w) => w.length > 3 && q.includes(w)).length >= 2) {
        return { toolName: "get_place_details", args: { placeId: p.id } }
      }
    }
  }

  // ── SEARCH PLACES intent (broad categories) ──
  const categoryMap: Record<string, string> = {
    "hotel": "Stay", "lodge": "Stay", "stay": "Stay", "accommodation": "Stay", "sleep": "Stay", "room": "Stay", "chalet": "Stay", "resort": "Stay",
    "car rental": "Get Around", "car hire": "Get Around", "taxi": "Get Around", "shuttle": "Get Around", "transport": "Get Around", "bus": "Get Around", "coach": "Get Around", "cab": "Get Around", "ferry": "Get Around", "camper": "Get Around",
    "restaurant": "Services", "food": "Services", "eat": "Services", "dining": "Services", "sadza": "Services", "coffee": "Services", "nando": "Services",
    "shop": "Services", "craft": "Services", "souvenir": "Services", "market": "Services", "basket": "Services", "leather": "Services",
    "hospital": "Emergency & Health", "clinic": "Emergency & Health", "pharmacy": "Emergency & Health", "doctor": "Emergency & Health", "police": "Emergency & Health", "fire": "Emergency & Health", "emergency": "Emergency & Health", "ambulance": "Emergency & Health",
    "safari": "Things to Do", "game drive": "Things to Do", "tour": "Things to Do", "guided": "Things to Do", "hike": "Things to Do", "trek": "Things to Do", "boat": "Things to Do", "cruise": "Things to Do", "photo": "Things to Do", "drumming": "Things to Do",
    "heritage": "Places", "monument": "Places", "ruins": "Places", "unesco": "Places",
    "nature": "Places", "lake": "Places", "mountain": "Places", "hot spring": "Things to Do", "bird": "Things to Do", "park": "Places", "wildlife": "Things to Do",
    "experience": "Experiences", "activity": "Experiences", "things to do": "Things to Do",
    "service": "Services", "fuel": "Services", "supermarket": "Services", "grocery": "Services",
    "guide": "Services",
  }

  // Parse explicit km distance
  const kmMatch = q.match(/(\d+)\s*(?:km|kilometers?|kilometres?)/)
  const parsedMaxKm = kmMatch ? parseInt(kmMatch[1], 10) : null

  // Check for nearby/close/within/places intent
  if (q.includes("near") || q.includes("close") || q.includes("around") || q.includes("nearby") || q.includes("within") || q.includes("places") || q.includes("available") || parsedMaxKm) {
    const maxKm = parsedMaxKm || 60
    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (q.includes(keyword)) {
        return { toolName: "search_places", args: { category: cat, maxDistanceKm: maxKm } }
      }
    }
    return { toolName: "search_places", args: { maxDistanceKm: maxKm } }
  }

  // Direct category search
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (q.includes(keyword)) {
      return { toolName: "search_places", args: { category: cat } }
    }
  }

  // ── ACCESSIBILITY intent ──
  if (q.includes("wheelchair") || q.includes("accessib") || q.includes("disability") || q.includes("ramp")) {
    return { toolName: "search_places", args: { accessibilityFeature: "full" } }
  }

  // Broad "what" / "show" intent
  if (q.includes("what") || q.includes("show")) {
    return { toolName: "search_places", args: { maxDistanceKm: 60 } }
  }

  return null
}

/**
 * Execute a detected tool call against real local data.
 * ALWAYS returns results — uses sorted-by-distance fallback if GPS filters yield nothing.
 * Limits to 3 items max for display space.
 */
export function executeToolCall(intent: { toolName: string; args: Record<string, any> }, location?: UserLocation): ToolCallResult {
  const MAX_DISPLAY = 3

  switch (intent.toolName) {
    case "search_places": {
      let results = MASTER_DATASET.map((p) => {
        const computedDistanceKm = location
          ? Math.round(haversineKm(location.lat, location.lng, p.lat, p.lng) * 10) / 10
          : p.distanceKm
        return { ...p, distanceKm: computedDistanceKm, computedDistanceKm }
      })

      results.sort((a, b) => a.distanceKm - b.distanceKm)

      if (intent.args.category) {
        const c = intent.args.category.toLowerCase()
        const filtered = results.filter((i) =>
          i.category.toLowerCase().includes(c) || i.subCategory.toLowerCase().includes(c)
        )
        if (filtered.length > 0) results = filtered
      }

      if (intent.args.maxDistanceKm) {
        const maxKm = intent.args.maxDistanceKm
        const distFiltered = results.filter((i) => i.distanceKm <= maxKm)
        if (distFiltered.length > 0) results = distFiltered
      }

      if (intent.args.accessibilityFeature) {
        const f = intent.args.accessibilityFeature.toLowerCase()
        const accFiltered = results.filter((i) =>
          i.accessibility.mobility.toLowerCase().includes(f) ||
          i.accessibility.terrain.toLowerCase().includes(f)
        )
        if (accFiltered.length > 0) results = accFiltered
      }

      return { tool: "search_places", results: results.slice(0, MAX_DISPLAY) }
    }

    case "get_cultural_stories": {
      const site = (intent.args.siteName || "").toLowerCase()
      const stories = INDIGENOUS_CULTURAL_STORIES.filter(
        (s) => !site || s.placeName.toLowerCase().includes(site) || s.title.toLowerCase().includes(site)
      )
      return { tool: "get_cultural_stories", results: (stories.length > 0 ? stories : INDIGENOUS_CULTURAL_STORIES).slice(0, MAX_DISPLAY) }
    }

    case "place_booking": {
      const place = MASTER_DATASET.find((p) => p.id === intent.args.placeId) || MASTER_DATASET[0]
      const priceNum = parseFloat(place.entryPrice?.replace(/[^0-9.]/g, "") || "25") || 25
      const booking = apiCreateBooking({
        placeId: place.id,
        touristName: "Tawanda",
        touristEmail: "tawanda@zimtour.co.zw",
        touristPhone: "+263 77 123 4567",
        bookingDate: new Date().toISOString().split("T")[0],
        guests: intent.args.guests || 2,
        unitPriceUSD: priceNum,
        paymentMethod: "EcoCash",
      })
      return { tool: "place_booking", result: booking }
    }

    case "get_place_details": {
      const place = MASTER_DATASET.find((p) => p.id === intent.args.placeId) || MASTER_DATASET[0]
      return { tool: "get_place_details", result: place }
    }

    case "get_reviews": {
      const place = MASTER_DATASET.find((p) => p.id === intent.args.placeId) || MASTER_DATASET[0]
      return { tool: "get_reviews", placeName: place.name, results: (place.reviewsList || []).slice(0, MAX_DISPLAY) }
    }

    default:
      return { tool: "search_places", results: MASTER_DATASET.slice(0, MAX_DISPLAY) }
  }
}

/**
 * Build a RAG context string from tool results so the LLM can reference real data
 */
function buildToolRAGContext(toolResult: ToolCallResult): string {
  if (toolResult.tool === "search_places") {
    const items = toolResult.results.map((p, i) =>
      `${i + 1}. "${p.name}" — ${p.subCategory}, ${p.distanceKm}km away, rated ${p.rating}★ (${p.reviews} reviews), entry ${p.entryPrice}, accessibility: ${p.accessibility.mobility}`
    ).join(". ")
    return `[TOOL RESULT: Found ${toolResult.results.length} places] ${items}. These cards are being displayed to the user below your message. Reference them naturally (e.g. "I found 3 great options near you — here they are with distances and ratings").`
  }
  if (toolResult.tool === "get_cultural_stories") {
    const items = toolResult.results.map((s, i) =>
      `${i + 1}. "${s.title}" by ${s.storyteller}, recorded in ${s.language}, ${s.format} format, at ${s.placeName}`
    ).join(". ")
    return `[TOOL RESULT: Found ${toolResult.results.length} indigenous oral history recordings] ${items}. Cards with audio playback are displayed below. Reference the stories naturally.`
  }
  if (toolResult.tool === "place_booking") {
    const b = toolResult.result
    return `[TOOL RESULT: Booking CONFIRMED] Confirmation code: ${b.confirmationCode}, place: ${b.placeName}, date: ${b.bookingDate}, ${b.guests} guests, total $${b.totalAmountUSD} USD paid via ${b.paymentMethod}. A booking receipt card is shown below. Confirm the booking details warmly.`
  }
  if (toolResult.tool === "get_place_details") {
    const p = toolResult.result
    return `[TOOL RESULT: Place details] "${p.name}" — ${p.category}/${p.subCategory}, ${p.location}, rated ${p.rating}★, entry ${p.entryPrice}. A detail card is shown below. Describe the highlights warmly.`
  }
  if (toolResult.tool === "get_reviews") {
    const reviews = toolResult.results.map((r) => `${r.author} (${r.rating}★): "${r.comment}"`).join(". ")
    return `[TOOL RESULT: ${toolResult.results.length} verified reviews for "${toolResult.placeName}"] ${reviews}. Review cards are displayed below. Summarize the sentiment.`
  }
  return ""
}

// ── Legacy tool functions ──
export function searchZimTourListings(args: { category?: string; maxDistanceKm?: number; accessibilityFeature?: string }, location?: UserLocation): PlaceDetail[] {
  const result = executeToolCall({ toolName: "search_places", args }, location)
  return result.tool === "search_places" ? result.results : []
}

export function getIndigenousOralHistory(args: { siteName?: string }) {
  const site = (args.siteName || "Great Zimbabwe").toLowerCase()
  const story = INDIGENOUS_CULTURAL_STORIES.find((s) => s.placeName.toLowerCase().includes(site)) || INDIGENOUS_CULTURAL_STORIES[0]
  return { siteName: story.placeName, elderName: story.storyteller, summary: story.transcript }
}

export type ChatHistoryMessage = { role: "user" | "model"; text: string }

export function stripMarkdown(text: string): string {
  if (!text) return ""
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1").replace(/_(.*?)_/g, "$1")
    .replace(/^#+\s+/gm, "").replace(/^[\*\-\+]\s+/gm, "")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1").replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n").trim()
}

function buildSystemPrompt(location: UserLocation, language: SupportedLanguage = "shona", ragContext?: string): string {
  let base =
    "You are ZimTour AI, a concise Zimbabwe travel assistant with REAL booking and search capabilities. " +
    "Reply in 1-3 plain text sentences only. No markdown, no asterisks, no hashes, no bullet dashes, no numbered lists. " +
    "Warm Zimbabwean hospitality tone. "

  if (language === "shona") {
    base += "Reply in Shona (ChiShona) with warm Zimbabwean hospitality. "
  } else if (language === "spanish") {
    base += "Respond clearly in Spanish. "
  } else if (language === "english") {
    base += "Respond in clear English. "
  } else {
    base += "Respond in the user's language or clear English. "
  }

  // Core capabilities — tell the LLM what it CAN do
  base += "CAPABILITIES: You CAN and DO book experiences, hotels, tours, and restaurants directly. " +
    "You CAN search the ZimTour verified database of 50+ places, stays, services, transport, and activities. " +
    "You CAN show cultural stories with audio recordings from Shona elders. " +
    "You CAN show verified reviews. " +
    "You CAN access all platform data including guides, car rentals, lodges, heritage sites, restaurants, and emergency services. " +
    "NEVER say 'I cannot book' or 'I cannot make reservations' — you absolutely can and do. "

  // RAG context from tool results
  if (ragContext) {
    base += ragContext + " "
    base += "IMPORTANT: Reference the data shown in the cards. Don't repeat every detail, just give a warm summary referencing key highlights (closest place, best rated, price range, etc). "
  } else {
    base += "If you don't have specific data to reference, give a warm helpful response. "
  }

  // Fallback instruction
  base += "If the user asks about something NOT on our platform (e.g. a specific lodge not in our database), acknowledge that and offer to search what we DO have. "

  if (location) {
    const nearby = getNearbyPlaces(location, 60, 4)
    base += ` User GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}.`
    if (nearby.length > 0) {
      base += ` Nearby: ${nearby.map((p) => `${p.name} (${p.gpsDistanceKm}km)`).join(", ")}.`
    }
  }

  return base
}

// ── Instant local engine (0ms, GPS-aware) ──
function getInstantLocalResponse(query: string, location: UserLocation, language: SupportedLanguage = "shona"): string {
  const q = query.trim().toLowerCase()

  const nearby = location ? getNearbyPlaces(location, 30, 3) : []

  if (/^(mhoro|salibonani|hi|hello|hey|hola)\b/.test(q) || q.includes("mangwanani") || q.includes("masikati") || q.includes("how are you")) {
    if (language === "shona") {
      return nearby.length > 0
        ? `Mhoro! Mauya kuZimTour Intelligence. Ndinoona muri pedyo ne ${nearby[0]?.name || "Masvingo"}. Ndingakubatsirai sei nhasi?`
        : "Mhoro! Mauya kuZimTour Intelligence. Ndiri mubatsiri wenyu we AI wekufamba muZimbabwe. Mangada kuongorora chii?"
    } else if (language === "spanish") {
      return "¡Hola! Bienvenido a ZimTour Intelligence. Soy tu asistente de viajes AI. ¿Qué te gustaría explorar?"
    }
    return nearby.length > 0
      ? `Mhoro! Welcome to ZimTour Intelligence. I can see you are near ${nearby[0]?.name || "Masvingo"}. How can I help you explore today?`
      : "Mhoro! Welcome to ZimTour Intelligence. I can book experiences, find places, share cultural stories, and help with transport. What would you like?"
  }

  return ""
}

/**
 * Stream real-time token chunks using groq-sdk with TRUE RAG:
 * Phase 1: Detect intent & execute tools (get real data)
 * Phase 2: Inject tool results into system prompt (RAG)
 * Phase 3: Stream AI response that references actual tool data
 * Phase 4: Deliver tool result cards to UI
 */
export async function streamGeminiLiveAI(
  userQuery: string,
  history: ChatHistoryMessage[] = [],
  onChunk?: (chunkText: string, fullText: string) => void,
  location?: UserLocation,
  language: SupportedLanguage = "shona",
  onToolCalls?: (tools: ToolCallResult[]) => void,
): Promise<string> {
  // 0. Detect tool intent (fast, zero-latency)
  const toolIntent = detectToolIntent(userQuery, location || undefined)

  // 1. Execute tools FIRST to get data for RAG injection
  let toolResult: ToolCallResult | null = null
  let ragContext = ""
  if (toolIntent) {
    try {
      toolResult = executeToolCall(toolIntent, location || undefined)
      ragContext = buildToolRAGContext(toolResult)
    } catch (err) {
      console.warn("Tool execution error:", err)
    }
  }

  // 2. Instant local acknowledgement (greetings only)
  const instantReply = getInstantLocalResponse(userQuery, location || null, language)
  if (instantReply) {
    onChunk?.(instantReply, instantReply)
  }

  // 3. Groq SDK streaming — system prompt now includes RAG context from tool results
  let finalText = instantReply || ""
  try {
    const systemPrompt = buildSystemPrompt(location || null, language, ragContext || undefined)

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-4).map((msg) => ({
        role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: msg.text,
      })),
      { role: "user" as const, content: userQuery },
    ]

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
      reasoning_effort: "medium",
      stop: null,
    })

    let accumulated = ""
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || ""
      if (content) {
        accumulated += content
        const cleanedSoFar = stripMarkdown(accumulated)
        onChunk?.(content, cleanedSoFar)
      }
    }

    const finalGroqReply = stripMarkdown(accumulated)
    if (finalGroqReply.length > 5) {
      finalText = finalGroqReply
    }
  } catch (err: any) {
    console.warn("Groq SDK streaming error:", err?.message || err)
    if (!finalText) {
      finalText = "I can help you explore Great Zimbabwe, Lake Mutirikwi, and local heritage experiences."
      onChunk?.(finalText, finalText)
    }
  }

  // 4. Deliver tool cards to UI AFTER text finishes streaming
  if (toolResult && onToolCalls) {
    onToolCalls([toolResult])
  }

  return finalText
}

export async function queryGeminiLiveAI(
  userQuery: string,
  history: ChatHistoryMessage[] = [],
  language: SupportedLanguage = "shona",
): Promise<string> {
  return streamGeminiLiveAI(userQuery, history, undefined, undefined, language)
}
