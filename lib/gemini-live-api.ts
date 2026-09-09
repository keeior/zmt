import { Groq } from "groq-sdk"
import {
  MASTER_DATASET,
  INDIGENOUS_CULTURAL_STORIES,
  type PlaceDetail,
  type IndigenousStory,
  type BookingRecord,
  type ReviewItem,
  apiCreateBooking,
} from "./zimtour-api"
import type { SupportedLanguage, PlannedRoute, PlannedRouteStop } from "./zimtour-store"
import { setPlannedRoute } from "./zimtour-store"
import {
  type TravellerMemory,
  loadMemory,
  saveMemory,
  memoryToPromptContext,
  extractSignalsFromQuery,
  recordPlaceDiscussed,
} from "./agent-memory"
import type { PlanStep } from "./agent-planner"

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
  | { tool: "plan_route"; route: PlannedRoute }

// ── Contextual reference resolution ──

/**
 * Extract the last-discussed place ID(s) from chat history.
 * Searches assistant messages for known place names in reverse order.
 */
function resolveContextualPlace(history: ChatHistoryMessage[]): PlaceDetail | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    const text = msg.text.toLowerCase()
    for (const p of MASTER_DATASET) {
      if (text.includes(p.name.toLowerCase())) return p
      // Check partial name match (2+ significant words)
      const words = p.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      if (words.length >= 2 && words.filter((w) => text.includes(w)).length >= 2) return p
    }
  }
  return null
}

/**
 * Detect which tool should be called based on user query.
 * Now with chat-history context for pronoun resolution ("it", "this place", "there").
 * Returns null if no tool is needed.
 */
export function detectToolIntent(
  query: string,
  location?: UserLocation,
  history: ChatHistoryMessage[] = []
): { toolName: string; args: Record<string, any> } | null {
  const q = query.toLowerCase().trim()

  // ── Greetings & small talk → no tool ──
  const isGreeting = /^(mhoro|salibonani|hi|hello|hey|hola|good\s*morning|good\s*afternoon|good\s*evening|how\s*are\s*you|sup|greetings|thanks?|thank\s*you|ok|okay|cool|bye|goodbye|cheers|ndatenda|tatenda|makadiini|makadii|ndinotenda)/i.test(q)
  if (isGreeting && q.split(/\s+/).length < 6) return null

  // ── Very short or conversational → no tool ──
  if (q.split(/\s+/).length < 3 && !/(book|find|near|review|place|hotel|food)/i.test(q)) return null

  // ── CONTEXTUAL REFERENCE: "it", "this place", "there", "about it" ──
  const hasContextualRef = /(about\s+it|this\s+place|about\s+them|about\s+there|people\s+saying|what\s+do\s+they|what\s+are\s+they|are\s+people)/i.test(q)
  const contextPlace = hasContextualRef ? resolveContextualPlace(history) : null

  // ── REVIEWS intent (expanded) ──
  if (/(review|rating|feedback|what\s+do\s+people\s+say|what\s+are\s+people\s+saying|people\s+saying|people\s+think|opinions?|worth\s+it|visitors?\s+say|recommend|testimonial)/i.test(q)) {
    if (contextPlace) return { toolName: "get_reviews", args: { placeId: contextPlace.id } }
    const place = MASTER_DATASET.find((p) => q.includes(p.name.toLowerCase()))
    if (place) return { toolName: "get_reviews", args: { placeId: place.id } }
    for (const p of MASTER_DATASET) {
      const words = p.name.toLowerCase().split(/\s+/)
      if (words.some((w) => w.length > 4 && q.includes(w))) {
        return { toolName: "get_reviews", args: { placeId: p.id } }
      }
    }
    // If context available from history, use it
    const fallback = resolveContextualPlace(history)
    if (fallback) return { toolName: "get_reviews", args: { placeId: fallback.id } }
    return { toolName: "get_reviews", args: { placeId: MASTER_DATASET[0].id } }
  }

  // ── BOOKING intent (only when user names a SPECIFIC place) ──
  if (/(book|reserve|bhodha)/i.test(q)) {
    // Check if user named a specific place
    const place = MASTER_DATASET.find((p) => q.includes(p.name.toLowerCase()))
    if (place) return { toolName: "place_booking", args: { placeId: place.id } }
    for (const p of MASTER_DATASET) {
      const words = p.name.toLowerCase().split(/\s+/)
      if (words.some((w) => w.length > 3 && q.includes(w))) {
        return { toolName: "place_booking", args: { placeId: p.id } }
      }
    }
    // Context reference: "book it" / "book this place"
    if (contextPlace) return { toolName: "place_booking", args: { placeId: contextPlace.id } }
    // Vague booking request → search bookable places instead
    return { toolName: "search_places", args: { category: "Stay" } }
  }

  // ── CULTURAL STORIES intent ──
  if (/(cultural|oral\s*histor|tradition|storytell|legend|heritage\s*stor|indigenous|svikiro|hungwe|njuzu|mukwerera|folklore)/i.test(q)) {
    const siteName = q.includes("mutirikwi") || q.includes("lake") ? "Mutirikwi" : "Great Zimbabwe"
    return { toolName: "get_cultural_stories", args: { siteName } }
  }

  // ── SPECIFIC PLACE detail intent ──
  if (/(tell\s+me\s+about|details|info\s+about|what\s+is)/i.test(q)) {
    const place = MASTER_DATASET.find((p) => q.includes(p.name.toLowerCase()))
    if (place) return { toolName: "get_place_details", args: { placeId: place.id } }
    for (const p of MASTER_DATASET) {
      const words = p.name.toLowerCase().split(/\s+/)
      if (words.filter((w) => w.length > 3 && q.includes(w)).length >= 2) {
        return { toolName: "get_place_details", args: { placeId: p.id } }
      }
    }
    if (contextPlace) return { toolName: "get_place_details", args: { placeId: contextPlace.id } }
  }

  // ── SEARCH PLACES intent ──
  const categoryMap: Record<string, string> = {
    "hotel": "Stay", "lodge": "Stay", "stay": "Stay", "accommodation": "Stay", "sleep": "Stay", "room": "Stay", "chalet": "Stay", "resort": "Stay",
    "car rental": "Get Around", "car hire": "Get Around", "taxi": "Get Around", "shuttle": "Get Around", "transport": "Get Around", "bus": "Get Around",
    "restaurant": "Services", "food": "Services", "eat": "Services", "dining": "Services", "sadza": "Services", "coffee": "Services",
    "shop": "Services", "craft": "Services", "souvenir": "Services", "market": "Services",
    "hospital": "Emergency & Health", "clinic": "Emergency & Health", "pharmacy": "Emergency & Health", "doctor": "Emergency & Health", "police": "Emergency & Health", "emergency": "Emergency & Health",
    "safari": "Things to Do", "game drive": "Things to Do", "tour": "Things to Do", "guided": "Things to Do", "hike": "Things to Do", "boat": "Things to Do", "cruise": "Things to Do",
    "heritage": "Places", "monument": "Places", "ruins": "Places", "unesco": "Places",
    "nature": "Places", "lake": "Places", "mountain": "Places", "park": "Places",
    "experience": "Experiences", "activity": "Experiences", "things to do": "Things to Do",
  }

  const kmMatch = q.match(/(\d+)\s*(?:km|kilometers?|kilometres?)/)
  const parsedMaxKm = kmMatch ? parseInt(kmMatch[1], 10) : null

  if (/(near|nearby|close\s*by|around\s*here|within|places\s+to|available\s+place|find\s+me|show\s+me\s+place)/i.test(q) || parsedMaxKm) {
    const maxKm = parsedMaxKm || 60
    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (q.includes(keyword)) {
        return { toolName: "search_places", args: { category: cat, maxDistanceKm: maxKm } }
      }
    }
    return { toolName: "search_places", args: { maxDistanceKm: maxKm } }
  }

  // Category keyword match (without needing "near")
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (q.includes(keyword)) {
      return { toolName: "search_places", args: { category: cat } }
    }
  }

  // ── ROUTE / ITINERARY / DIRECTIONS intent ──
  if (/(route|itinerary|driving|directions?|road\s*trip|day\s*trip|drive\s*to|plan.*trip|drive.*between|travel.*plan|how\s+to\s+get)/i.test(q)) {
    // Collect mentioned place IDs
    const mentionedPlaces: PlaceDetail[] = []
    for (const p of MASTER_DATASET) {
      if (q.includes(p.name.toLowerCase())) {
        mentionedPlaces.push(p)
      } else {
        const words = p.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
        if (words.length >= 2 && words.filter((w) => q.includes(w)).length >= 2) {
          mentionedPlaces.push(p)
        }
      }
    }
    // Default route: top 4 nearby places if no specific places mentioned
    return { toolName: "plan_route", args: { placeIds: mentionedPlaces.map((p) => p.id) } }
  }

  // ── ACCESSIBILITY intent ──
  if (/(wheelchair|accessib|disability|ramp)/i.test(q)) {
    return { toolName: "search_places", args: { accessibilityFeature: "full" } }
  }

  // ── No tool match → pure conversational LLM ──
  return null
}

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

    case "plan_route": {
      let routePlaces: PlaceDetail[] = []
      if (intent.args.placeIds?.length > 0) {
        routePlaces = intent.args.placeIds
          .map((id: string) => MASTER_DATASET.find((p) => p.id === id))
          .filter(Boolean) as PlaceDetail[]
      }
      // If fewer than 2 places, auto-pick top nearby ones
      if (routePlaces.length < 2) {
        const nearby = MASTER_DATASET
          .map((p) => {
            const dist = location
              ? Math.round(haversineKm(location.lat, location.lng, p.lat, p.lng) * 10) / 10
              : p.distanceKm
            return { ...p, computedDist: dist }
          })
          .sort((a, b) => a.computedDist - b.computedDist)
          .slice(0, 5)
        routePlaces = nearby
      }

      // Build route stops with estimated drive times
      const stops: PlannedRouteStop[] = routePlaces.map((p, i) => {
        const prevPlace = i > 0 ? routePlaces[i - 1] : null
        const driveMinutes = prevPlace
          ? Math.round(haversineKm(prevPlace.lat, prevPlace.lng, p.lat, p.lng) * 1.3) // ~1.3 min/km rough estimate
          : 0
        return {
          placeId: p.id,
          placeName: p.name,
          lat: p.lat,
          lng: p.lng,
          order: i + 1,
          estimatedDriveMinutes: driveMinutes,
        }
      })

      let totalKm = 0
      for (let i = 1; i < routePlaces.length; i++) {
        totalKm += haversineKm(routePlaces[i - 1].lat, routePlaces[i - 1].lng, routePlaces[i].lat, routePlaces[i].lng)
      }

      const route: PlannedRoute = {
        id: `route-${Date.now()}`,
        title: routePlaces.length <= 3
          ? routePlaces.map((p) => p.name.split(" ").slice(0, 2).join(" ")).join(" → ")
          : `${routePlaces.length}-Stop Zimbabwe Tour`,
        stops,
        totalDistanceKm: Math.round(totalKm * 10) / 10,
        totalDriveMinutes: stops.reduce((s, st) => s + (st.estimatedDriveMinutes || 0), 0),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      // Persist to store so the full-screen map renders it
      setPlannedRoute(route)

      return { tool: "plan_route", route }
    }

    default:
      return { tool: "search_places", results: MASTER_DATASET.slice(0, MAX_DISPLAY) }
  }
}

export type ChatHistoryMessage = { role: "user" | "assistant"; text: string }

export function stripMarkdown(text: string): string {
  if (!text) return ""
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1").replace(/_(.*?)_/g, "$1")
    .replace(/^#+\s+/gm, "").replace(/^[\*\-\+]\s+/gm, "")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1").replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n").trim()
}

async function streamFromGroq(
  systemPrompt: string,
  history: ChatHistoryMessage[],
  userQuery: string,
  onChunk?: (chunkText: string, fullText: string) => void
): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.text })),
      { role: "user", content: userQuery },
    ],
    model: GROQ_MODEL,
    stream: true,
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
  return stripMarkdown(accumulated)
}

/** Fast single-sentence reasoning (non-streaming, low tokens) */
async function generateReasoning(
  userQuery: string,
  history: ChatHistoryMessage[],
  detectedTool: string,
  language: SupportedLanguage
): Promise<string> {
  let langHint = "in English"
  if (language === "shona") langHint = "in Shona (ChiShona)"
  else if (language === "spanish") langHint = "in Spanish"

  const prompt = `You are ZimTour AI. The user just asked: "${userQuery}". You detected you need to use the "${detectedTool}" tool. Write exactly ONE short sentence ${langHint} explaining what you are about to do for the user. Be specific to their query. No markdown, no quotes, just the sentence.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        ...history.slice(-4).map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: userQuery },
      ],
      model: GROQ_MODEL,
      max_tokens: 50,
      stream: false,
    })
    const text = completion.choices[0]?.message?.content?.trim() || ""
    return stripMarkdown(text) || "Let me check that for you…"
  } catch {
    return "Let me check that for you…"
  }
}

const BASE_SYSTEM_PROMPT =
  "You are ZimTour AI, a concise Zimbabwe travel assistant with REAL booking and search capabilities. " +
  "Reply in 1-3 plain text sentences only. No markdown, no asterisks, no hashes, no bullet dashes, no numbered lists. " +
  "Warm Zimbabwean hospitality tone. "

function toolResultsToContext(results: ToolCallResult[]): string {
  const chunks: string[] = []
  for (const r of results) {
    if (r.tool === "search_places") {
      const list = r.results
        .map((p) => `${p.name} (${(p as any).computedDistanceKm ?? p.distanceKm}km${p.category ? ", " + p.category : ""})`)
        .join("; ")
      chunks.push(`Places found: ${list}.`)
    } else if (r.tool === "get_cultural_stories") {
      const list = r.results.map((s) => s.title ?? (s as any).name ?? s.id).join("; ")
      chunks.push(`Stories found: ${list}.`)
    } else if (r.tool === "place_booking") {
      const b = r.result
      chunks.push(`Booking created: confirmation ${b.confirmationCode ?? "pending"}${b.totalAmountUSD ? `, total USD $${b.totalAmountUSD}` : ""}.`)
    } else if (r.tool === "get_place_details") {
      chunks.push(`Place details retrieved: ${r.result.name}.`)
    } else if (r.tool === "get_reviews") {
      chunks.push(`${r.results.length} review(s) found for ${r.placeName}. Reviews: ${r.results.map((rv) => `"${rv.comment}" — ${rv.author} (${rv.rating}/5)`).join("; ")}`)
    } else if (r.tool === "plan_route") {
      const rt = r.route
      chunks.push(`Driving route planned: "${rt.title}" with ${rt.stops.length} stops. Total distance: ${rt.totalDistanceKm} km (~${rt.totalDriveMinutes} min drive). Stops: ${rt.stops.map((s) => `${s.order}. ${s.placeName}`).join(", ")}`)
    }
  }
  return chunks.length
    ? `Data just retrieved from ZimTour's live systems — reference it directly and specifically in your reply: ${chunks.join(" ")}`
    : ""
}

/**
 * Sequential 3-phase agent execution flow:
 *  Phase 1: Fast LLM reasoning (1 sentence explaining what AI will do)
 *  Phase 2: Tool execution (one at a time, emitting results sequentially)
 *  Phase 3: Grounded LLM stream (final reply referencing tool results)
 *
 * If no tool is needed → straight conversational LLM stream.
 */
export async function streamGeminiLiveAI(
  userQuery: string,
  history: ChatHistoryMessage[] = [],
  onChunk?: (chunkText: string, fullText: string) => void,
  location?: UserLocation,
  language: SupportedLanguage = "shona",
  onToolCalls?: (tools: ToolCallResult[]) => void,
  userId: string = "tawanda",
  onStepUpdate?: (steps: PlanStep[], isMultiStep: boolean) => void,
  onAck?: (text: string) => void
): Promise<string> {
  // Emit instant thinking acknowledgment
  onAck?.("Thinking…")

  let memory: TravellerMemory = loadMemory(userId)
  const storeState = (await import("./zimtour-store")).getZimTourStore()
  const aiPrefs = storeState.aiPreferences

  // Detect intent WITH chat history for contextual resolution
  const intent = detectToolIntent(userQuery, location || undefined, history)

  // Explicit set language instruction for the AI
  const langLabels: Record<string, string> = {
    shona: "Shona (ChiShona)",
    english: "English",
    spanish: "Spanish",
    french: "French",
    ndebele: "Ndebele (IsiNdebele)",
    mandarin: "Mandarin Chinese",
  }
  const targetLangLabel = langLabels[language] || language
  const langInstruction = `The user's set language is strictly ${targetLangLabel}. ALWAYS reply in ${targetLangLabel} with warm Zimbabwean hospitality unless explicitly requested otherwise. `

  // AI Preferences & Memory prompt context
  let aiPrefsContext = ""
  if (aiPrefs) {
    aiPrefsContext = `User Preferences & Persona Context: [Travel Style: ${aiPrefs.travelStyle}, Cuisine/Diet: ${aiPrefs.dietaryRequirement}, Preferred AI Tone: ${aiPrefs.aiTone}, Key Interests: ${aiPrefs.interests.join(", ")}, Extra Notes: ${aiPrefs.customContext}]. Use this context to tailor your responses to the user's explicit profile! `
  }

  // GPS Location context
  let locationContext = ""
  if (location) {
    const nearbyCount = MASTER_DATASET.filter(
      (p) => haversineKm(location.lat, location.lng, p.lat, p.lng) <= 30
    ).length
    locationContext = `Current User GPS Location: (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) with ${nearbyCount} verified destinations within 30km. `
  }

  const contextRule =
    "When answering queries that depend on location, distance, activities, or recommendations, proactively check and reference the user's location, interests, and travel context before giving deep responses. "

  // ═══ Phase A: No tools needed → pure conversational stream ═══
  if (!intent) {
    const memoryContext = memoryToPromptContext(memory)
    const systemPrompt = [BASE_SYSTEM_PROMPT, langInstruction, aiPrefsContext, locationContext, memoryContext, contextRule].filter(Boolean).join(" ")
    const reply = await streamFromGroq(systemPrompt, history, userQuery, onChunk)
    memory = extractSignalsFromQuery(memory, userQuery)
    memory.lastLanguage = language
    saveMemory(memory)
    return reply
  }

  // ═══ Phase 1: LLM Reasoning (fast, 1 sentence) ═══
  const reasoning = await generateReasoning(userQuery, history, intent.toolName, language)
  onAck?.(reasoning)

  // ═══ Phase 2: Sequential tool execution ═══
  const steps: PlanStep[] = [
    { id: "reason", label: reasoning, status: "done" as const },
    { id: "search", label: `Running ${intent.toolName.replace(/_/g, " ")}`, status: "active" as const },
    { id: "draft", label: "Drafting your answer", status: "pending" as const },
  ]
  onStepUpdate?.(steps, false)

  // Execute tool
  const toolResult = executeToolCall(intent, location || undefined)
  const toolResults: ToolCallResult[] = [toolResult]

  // Track discussed places in memory
  if (toolResult.tool === "search_places") {
    toolResult.results.forEach((p) => { memory = recordPlaceDiscussed(memory, p.id) })
  }

  // Update step: tool done
  steps[1].status = "done"
  steps[1].detail = toolResult.tool === "search_places"
    ? `Found ${(toolResult as any).results.length} places`
    : toolResult.tool === "get_reviews"
    ? `Found ${(toolResult as any).results.length} reviews`
    : toolResult.tool === "get_cultural_stories"
    ? `Found ${(toolResult as any).results.length} stories`
    : "Done"
  onStepUpdate?.([...steps], false)

  // Emit tool cards to UI
  onToolCalls?.(toolResults)

  // Small pause so user sees the tool results before the final text streams in
  await new Promise((r) => setTimeout(r, 300))

  // ═══ Phase 3: Grounded LLM stream ═══
  steps[2].status = "active"
  onStepUpdate?.([...steps], false)

  const memoryContext = memoryToPromptContext(memory)
  const grounding = toolResultsToContext(toolResults)
  const systemPrompt = [BASE_SYSTEM_PROMPT, langInstruction, aiPrefsContext, locationContext, memoryContext, contextRule, grounding].filter(Boolean).join(" ")

  const finalReply = await streamFromGroq(systemPrompt, history, userQuery, onChunk)

  // Mark all done
  steps[2].status = "done"
  onStepUpdate?.([...steps], false)

  memory = extractSignalsFromQuery(memory, userQuery)
  memory.lastLanguage = language
  saveMemory(memory)

  return finalReply
}

export async function queryGeminiLiveAI(
  userQuery: string,
  history: ChatHistoryMessage[] = [],
  language: SupportedLanguage = "shona"
): Promise<string> {
  return streamGeminiLiveAI(userQuery, history, undefined, undefined, language)
}
