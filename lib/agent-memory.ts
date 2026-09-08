/**
 * ZimTour Working Memory
 * ------------------------------------------------------------------
 * Two tiers:
 *  1. SHORT-TERM (per-turn) — scratchpad for the current multi-step task
 *  2. LONG-TERM (persisted) — profile of the traveller: interest scores,
 *     travel-party info, accessibility needs, places discussed & booked.
 */

export type InterestTag =
  | "heritage"
  | "wildlife"
  | "nature"
  | "adventure"
  | "culture"
  | "food"
  | "relaxation"
  | "photography"
  | "hiking"
  | "family"
  | "budget"
  | "luxury"
  | "accessibility"

export type TravellerMemory = {
  userId: string
  name?: string
  interestScores: Partial<Record<InterestTag, number>>
  travelParty?: { size?: number; withChildren?: boolean }
  accessibilityNeeds?: string[]
  placesDiscussed: string[]
  placesBooked: string[]
  lastLanguage?: string
  summary: string
  updatedAt: string
}

const STORAGE_KEY = "zimtour_traveller_memory_v1"

function emptyMemory(userId: string): TravellerMemory {
  return {
    userId,
    interestScores: {},
    placesDiscussed: [],
    placesBooked: [],
    summary: "",
    updatedAt: new Date().toISOString(),
  }
}

export function loadMemory(userId: string): TravellerMemory {
  if (typeof window === "undefined") return emptyMemory(userId)
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (!raw) return emptyMemory(userId)
    return { ...emptyMemory(userId), ...JSON.parse(raw) }
  } catch {
    return emptyMemory(userId)
  }
}

export function saveMemory(memory: TravellerMemory) {
  if (typeof window === "undefined") return
  memory.updatedAt = new Date().toISOString()
  window.localStorage.setItem(`${STORAGE_KEY}_${memory.userId}`, JSON.stringify(memory))
}

const INTEREST_KEYWORDS: Record<InterestTag, RegExp> = {
  heritage: /heritage|ruins|history|monument|ancient|unesco/i,
  wildlife: /wildlife|safari|animals?|rhino|elephant|lion|game drive/i,
  nature: /lake|hike|hiking|mountain|nature|scenic|view/i,
  adventure: /adventure|kayak|boat|climb|adrenaline/i,
  culture: /culture|tradition|shona|ndebele|craft|story|storytelling/i,
  food: /food|eat|restaurant|cuisine|sadza|dining/i,
  relaxation: /relax|spa|thermal|picnic|quiet|peaceful/i,
  photography: /photo|photograph/i,
  hiking: /hik(e|ing)|trek|trail/i,
  family: /kids?|children|family/i,
  budget: /budget|cheap|affordable|free/i,
  luxury: /luxury|lodge|premium|5-star/i,
  accessibility: /wheelchair|accessib|ramp|mobility/i,
}

export function extractSignalsFromQuery(memory: TravellerMemory, query: string): TravellerMemory {
  const next: TravellerMemory = { ...memory, interestScores: { ...memory.interestScores } }
  for (const [tag, pattern] of Object.entries(INTEREST_KEYWORDS) as [InterestTag, RegExp][]) {
    if (pattern.test(query)) {
      next.interestScores[tag] = (next.interestScores[tag] || 0) + 1
    }
  }
  if (/(\d+)\s*(kids|children)/i.test(query)) {
    next.travelParty = { ...next.travelParty, withChildren: true }
  }
  return next
}

export function recordPlaceDiscussed(memory: TravellerMemory, placeId: string): TravellerMemory {
  if (memory.placesDiscussed.includes(placeId)) return memory
  return { ...memory, placesDiscussed: [...memory.placesDiscussed, placeId].slice(-20) }
}

export function recordPlaceBooked(memory: TravellerMemory, placeId: string): TravellerMemory {
  return { ...memory, placesBooked: [...new Set([...memory.placesBooked, placeId])] }
}

export function topInterests(memory: TravellerMemory, n = 3): InterestTag[] {
  return (Object.entries(memory.interestScores) as [InterestTag, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag)
}

export function memoryToPromptContext(memory: TravellerMemory): string {
  const interests = topInterests(memory)
  const parts: string[] = []
  if (memory.name) parts.push(`Traveller: ${memory.name}.`)
  if (interests.length) parts.push(`Shows interest in: ${interests.join(", ")}.`)
  if (memory.travelParty?.withChildren) parts.push(`Travelling with children.`)
  if (memory.accessibilityNeeds?.length) parts.push(`Accessibility needs: ${memory.accessibilityNeeds.join(", ")}.`)
  if (memory.placesDiscussed.length) parts.push(`Already discussed: ${memory.placesDiscussed.slice(-5).join(", ")}.`)
  return parts.length ? `Known about this traveller — ${parts.join(" ")}` : ""
}
