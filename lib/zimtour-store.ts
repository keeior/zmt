"use client"

import { useState, useEffect } from "react"

export type AccessProfile = "mobility" | "visual" | "hearing" | "sensory"

export type SupportedLanguage = "shona" | "english" | "spanish" | "other"

export const LANGUAGE_OPTIONS: { id: SupportedLanguage; label: string; flag: string }[] = [
  { id: "shona", label: "Shona (ChiShona)", flag: "🇿🇼" },
  { id: "english", label: "English", flag: "🇬🇧" },
  { id: "spanish", label: "Spanish (Español)", flag: "🇪🇸" },
  { id: "other", label: "Other Language", flag: "🌐" },
]

export type ReviewItem = {
  id: string
  author: string
  rating: number
  date: string
  comment: string
  avatar: string
  verified: boolean
}

export type DemoPlace = {
  id: string
  name: string
  category: "Places" | "Experiences" | "Services"
  subCategory?: string
  location: string
  distanceKm: number // 30 or 60 range
  rating: number
  reviews: number
  seed: string
  desc: string
  entryPrice?: string
  accessibility: {
    mobility: "full" | "good" | "partial" | "none"
    visual: boolean
    hearing: boolean
    sensory: boolean
    facilities: boolean
    parking: boolean
    terrain: string
    lastVerified: string
  }
  reviewsList: ReviewItem[]
}

export const SEEDED_PLACES: DemoPlace[] = [
  {
    id: "great-zimbabwe",
    name: "Great Zimbabwe National Monument",
    category: "Places",
    subCategory: "Heritage Site",
    location: "Masvingo",
    distanceKm: 0.8,
    rating: 4.8,
    reviews: 230,
    seed: "gzruins2",
    desc: "UNESCO World Heritage site and ancient stone city of the Kingdom of Zimbabwe.",
    entryPrice: "USD 10",
    accessibility: {
      mobility: "partial",
      visual: true,
      hearing: false,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Uneven stone pathways & hill slope",
      lastVerified: "2 days ago",
    },
    reviewsList: [
      {
        id: "gz1",
        author: "Tariro Moyo",
        rating: 5,
        date: "3 days ago",
        comment: "Breathtaking heritage site! Walking through the Great Enclosure stone walls felt magical. Guided tour explained the Shona history with great passion.",
        avatar: "TM",
        verified: true,
      },
      {
        id: "gz2",
        author: "David Smith",
        rating: 5,
        date: "1 week ago",
        comment: "An incredible ancient monument. The dry stone masonry without mortar is astounding. Recommend visiting at sunrise.",
        avatar: "DS",
        verified: true,
      },
      {
        id: "gz3",
        author: "Chipo Ndlovu",
        rating: 4,
        date: "2 weeks ago",
        comment: "Beautiful historical grounds. Staff provided great assistance for visitors needing ramp access near the main museum.",
        avatar: "CN",
        verified: true,
      },
    ],
  },
  {
    id: "lake-mutirikwi",
    name: "Lake Mutirikwi",
    category: "Places",
    subCategory: "Nature & Lake",
    location: "Masvingo",
    distanceKm: 25,
    rating: 4.6,
    reviews: 98,
    seed: "lakemutirikwi2",
    desc: "Scenic lake views, boating, fishing and bird watching near Kyle Recreational Park.",
    entryPrice: "USD 5",
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Paved pathways to boat dock",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "lm1",
        author: "Tendai Chiwenga",
        rating: 5,
        date: "5 days ago",
        comment: "Serene lakeside views and excellent boat ride options. Perfect for weekend family outings and sunset picnics.",
        avatar: "TC",
        verified: true,
      },
      {
        id: "lm2",
        author: "Sarah Jenkins",
        rating: 4,
        date: "2 weeks ago",
        comment: "Peaceful environment with rare bird species along the shoreline. Very relaxing escape from the city.",
        avatar: "SJ",
        verified: true,
      },
    ],
  },
  {
    id: "cultural-exp",
    name: "Local Cultural Experience",
    category: "Experiences",
    subCategory: "Culture & Living History",
    location: "Masvingo Village",
    distanceKm: 8,
    rating: 4.7,
    reviews: 86,
    seed: "culturalexp",
    desc: "Engage with local communities, learn traditional crafts, music, and Shona storytelling.",
    entryPrice: "USD 15",
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Flat courtyard",
      lastVerified: "3 days ago",
    },
    reviewsList: [
      {
        id: "ce1",
        author: "Kudzai Banda",
        rating: 5,
        date: "4 days ago",
        comment: "Unforgettable Shona drumming performance and traditional food tasting. The village elders welcomed us warmly.",
        avatar: "KB",
        verified: true,
      },
      {
        id: "ce2",
        author: "Mark Evans",
        rating: 5,
        date: "1 month ago",
        comment: "Hands-on pottery workshop and authentic storytelling around the fire pit. A true highlight of our trip.",
        avatar: "ME",
        verified: true,
      },
    ],
  },
  {
    id: "mushandike",
    name: "Mushandike Sanctuary",
    category: "Places",
    subCategory: "Wildlife & Nature",
    location: "Masvingo",
    distanceKm: 28,
    rating: 4.4,
    reviews: 42,
    seed: "mushandike",
    desc: "Protected sanctuary offering game drives, bird watching, and quiet nature walks.",
    entryPrice: "USD 8",
    accessibility: {
      mobility: "partial",
      visual: false,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Unpaved dirt tracks",
      lastVerified: "5 days ago",
    },
    reviewsList: [
      {
        id: "ms1",
        author: "Farai Gumbo",
        rating: 5,
        date: "1 week ago",
        comment: "Spotted sable antelope and waterbucks on our afternoon game drive! Very knowledgeable local rangers.",
        avatar: "FG",
        verified: true,
      },
      {
        id: "ms2",
        author: "Claire Bennett",
        rating: 4,
        date: "3 weeks ago",
        comment: "Quiet, unspoiled wilderness reserve. Great for wildlife photographers seeking untouched spots.",
        avatar: "CB",
        verified: true,
      },
    ],
  },
  {
    id: "dining-heritage",
    name: "Great Zimbabwe Village Restaurant",
    category: "Services",
    subCategory: "Food & Drink",
    location: "Masvingo",
    distanceKm: 1.2,
    rating: 4.5,
    reviews: 110,
    seed: "localfood",
    desc: "Authentic local Zimbabwean cuisine featuring sadza, nyama, and fresh indigenous vegetables.",
    entryPrice: "USD 8 – 15",
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Level entrance",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "dr1",
        author: "Rudo Makoni",
        rating: 5,
        date: "2 days ago",
        comment: "Best sadza reziyo and roadrunner chicken in Masvingo! Generous portions and very clean dining area.",
        avatar: "RM",
        verified: true,
      },
      {
        id: "dr2",
        author: "Jean-Pierre",
        rating: 4,
        date: "1 week ago",
        comment: "Delicious local beef stew served with traditional greens. Friendly service right by Great Zimbabwe entry.",
        avatar: "JP",
        verified: true,
      },
    ],
  },
  {
    id: "kyle-park",
    name: "Kyle Recreational Park",
    category: "Places",
    subCategory: "Recreation & Park",
    location: "Masvingo",
    distanceKm: 18,
    rating: 4.4,
    reviews: 45,
    seed: "kylepark",
    desc: "Lakeside park with white rhino sanctuary and peaceful picnic spots.",
    entryPrice: "USD 7",
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: false,
      facilities: true,
      parking: true,
      terrain: "Grassy and paved areas",
      lastVerified: "4 days ago",
    },
    reviewsList: [
      {
        id: "kp1",
        author: "Blessing Sibanda",
        rating: 5,
        date: "6 days ago",
        comment: "We were lucky to see three white rhinos near the dam edge! Magnificent park for family picnics.",
        avatar: "BS",
        verified: true,
      },
    ],
  },

  // ── Extended 60 km entries ──
  {
    id: "mashava-hot-springs",
    name: "Mashava Hot Springs",
    category: "Places",
    subCategory: "Natural Wonder",
    location: "Mashava",
    distanceKm: 42,
    rating: 4.5,
    reviews: 54,
    seed: "hotsprings",
    desc: "Geothermal hot springs known for relaxing thermal baths and mineral-rich waters.",
    entryPrice: "USD 6",
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Ramped pools",
      lastVerified: "2 days ago",
    },
    reviewsList: [
      {
        id: "hs1",
        author: "Nyasha Zhou",
        rating: 5,
        date: "4 days ago",
        comment: "Soothing natural hot water! Great for muscle relief after hiking around Masvingo.",
        avatar: "NZ",
        verified: true,
      },
    ],
  },
  {
    id: "nyuni-mountain",
    name: "Nyuni Mountain Range",
    category: "Places",
    subCategory: "Adventure & Hiking",
    location: "Masvingo District",
    distanceKm: 48,
    rating: 4.6,
    reviews: 39,
    seed: "mountain",
    desc: "Dramatic mountain peaks offering panoramic views over Lake Mutirikwi and valleys.",
    entryPrice: "Free",
    accessibility: {
      mobility: "none",
      visual: false,
      hearing: true,
      sensory: true,
      facilities: false,
      parking: true,
      terrain: "Steep rocky trail",
      lastVerified: "6 days ago",
    },
    reviewsList: [
      {
        id: "nm1",
        author: "Brian Ncube",
        rating: 5,
        date: "1 week ago",
        comment: "Challenging summit hike but the 360-degree view over Lake Mutirikwi is worth every step!",
        avatar: "BN",
        verified: true,
      },
    ],
  },
  {
    id: "mavinga-bird",
    name: "Mavinga Bird & Flower Sanctuary",
    category: "Places",
    subCategory: "Botanic & Wildlife",
    location: "Masvingo East",
    distanceKm: 52,
    rating: 4.3,
    reviews: 31,
    seed: "birdsanctuary",
    desc: "Quiet botanical sanctuary featuring rare indigenous flora and colorful bird species.",
    entryPrice: "USD 5",
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Smooth boardwalks",
      lastVerified: "3 days ago",
    },
    reviewsList: [
      {
        id: "mb1",
        author: "Grace Peterson",
        rating: 5,
        date: "2 weeks ago",
        comment: "Beautiful boardwalks amidst aloe gardens and sunbirds. Ramped and accessible for wheelchairs.",
        avatar: "GP",
        verified: true,
      },
    ],
  },
  {
    id: "chilo-gorge",
    name: "Chilo Gorge Safari Outpost",
    category: "Places",
    subCategory: "Wilderness Lodge",
    location: "Southeast Border",
    distanceKm: 58,
    rating: 4.9,
    reviews: 78,
    seed: "gorgelodge",
    desc: "Overlooking the Save River and cliffside wilderness views near Gonarezhou.",
    entryPrice: "USD 45",
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Decked walkways",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "cg1",
        author: "Liam Thorne",
        rating: 5,
        date: "3 days ago",
        comment: "World-class eco-lodge overlooking the Save River gorge. Saw elephants drinking right below our balcony!",
        avatar: "LT",
        verified: true,
      },
    ],
  },
  {
    id: "gonarezhou-gate",
    name: "Gonarezhou National Park (North Gate)",
    category: "Places",
    subCategory: "National Park",
    location: "Chiredzi / Masvingo South",
    distanceKm: 60,
    rating: 4.9,
    reviews: 142,
    seed: "gonarezhou",
    desc: "Land of the Elephants — famous Chilojo Cliffs and untouched wilderness.",
    entryPrice: "USD 12",
    accessibility: {
      mobility: "partial",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "4x4 vehicle access",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "gzp1",
        author: "Simbarashe Mpofu",
        rating: 5,
        date: "2 days ago",
        comment: "The red sandstone Chilojo Cliffs are breathtaking. Raw, untouched African safari at its absolute best.",
        avatar: "SM",
        verified: true,
      },
    ],
  },
  {
    id: "craft-market",
    name: "Masvingo Artisan Craft Market",
    category: "Services",
    subCategory: "Shopping & Culture",
    location: "Masvingo Town",
    distanceKm: 34,
    rating: 4.4,
    reviews: 62,
    seed: "weaving",
    desc: "Cooperative market selling soapstone carvings, woven baskets, and traditional Shona art.",
    entryPrice: "Free",
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Paved precinct",
      lastVerified: "4 days ago",
    },
    reviewsList: [
      {
        id: "cm1",
        author: "Hannah Krause",
        rating: 5,
        date: "5 days ago",
        comment: "Purchased authentic hand-carved soapstone sculptures directly from local Shona artists. Wonderful market!",
        avatar: "HK",
        verified: true,
      },
    ],
  },
]

/* ── API Query Helpers for Isolated Data Access ── */

export function getPlaceById(id: string): DemoPlace | undefined {
  return SEEDED_PLACES.find((p) => p.id === id)
}

export function getPlaceReviews(placeId: string): ReviewItem[] {
  const place = getPlaceById(placeId)
  return place ? place.reviewsList : []
}

export type UserRole = "tourist" | "provider" | "contributor" | "authority"

export type AIPreferences = {
  travelStyle: "cultural" | "adventure" | "relaxation" | "wildlife" | "family"
  dietaryRequirement: "none" | "halal" | "vegetarian" | "vegan" | "local-shona"
  aiTone: "concise" | "detailed" | "storyteller"
  interests: string[]
  customContext: string
}

export type PlannedRouteStop = {
  placeId: string
  placeName: string
  lat: number
  lng: number
  order: number
  estimatedDriveMinutes?: number
}

export type PlannedRoute = {
  id: string
  title: string
  stops: PlannedRouteStop[]
  totalDistanceKm: number
  totalDriveMinutes: number
  createdAt: string
}

export type StoreState = {
  selectedRangeKm: 30 | 60
  selectedLanguage: SupportedLanguage
  activeAccessibilityProfiles: AccessProfile[]
  selectedPlaceId: string
  aiContextPrompt: string | null
  aiPreferences: AIPreferences
  plannedRoute: PlannedRoute | null
  userRole: UserRole
  providerVerified: boolean
  verifiedCategory: string | null

  // Dynamic Demo Data Loop Counters
  totalVisitors: number
  avgStayNights: number
  localRatio: number
  intlRatio: number
  activityTrend: number
  userBookingsCount: number
  userViewsCount: number
  recentActivities: { id: string; text: string; time: string }[]
  
  // Node Drill Down State
  selectedNode: string | null
  drillDownPath: string[]
}

let globalState: StoreState = {
  selectedRangeKm: 30,
  selectedLanguage: "shona",
  activeAccessibilityProfiles: [],
  selectedPlaceId: "great-zimbabwe",
  aiContextPrompt: null,
  aiPreferences: {
    travelStyle: "cultural",
    dietaryRequirement: "local-shona",
    aiTone: "storyteller",
    interests: ["History & Stone Ruins", "UNESCO Heritage", "Local Crafts & Arts", "Wildlife Safaris"],
    customContext: "Prefers authentic cultural immersion and verified local guides in Masvingo & Matobo.",
  },
  plannedRoute: null,
  userRole: "tourist",
  providerVerified: false,
  verifiedCategory: "places",

  totalVisitors: 24821,
  avgStayNights: 3.4,
  localRatio: 62,
  intlRatio: 38,
  activityTrend: 8.2,
  userBookingsCount: 2,
  userViewsCount: 14,
  recentActivities: [
    { id: "1", text: "Tourist booked Great Zimbabwe Guided Tour", time: "Just now" },
    { id: "2", text: "Lake Mutirikwi boat trip search spike (+14%)", time: "5 mins ago" },
  ],
  selectedNode: "Masvingo",
  drillDownPath: ["Zimbabwe", "Masvingo", "Great Zimbabwe"],
}

const listeners = new Set<() => void>()

export function getZimTourStore(): StoreState {
  return globalState
}

export function subscribeZimTourStore(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit() {
  listeners.forEach((l) => l())
}

/* ── Actions ── */

export function setAIPreferences(prefs: Partial<AIPreferences>) {
  globalState = {
    ...globalState,
    aiPreferences: {
      ...globalState.aiPreferences,
      ...prefs,
    },
  }
  emit()
}

export function setSelectedLanguage(lang: SupportedLanguage) {
  globalState = { ...globalState, selectedLanguage: lang }
  emit()
}

export function setRangeKm(range: 30 | 60) {
  globalState = { ...globalState, selectedRangeKm: range }
  emit()
}

export function toggleAccessibilityProfile(profile: AccessProfile) {
  const current = globalState.activeAccessibilityProfiles
  const next = current.includes(profile)
    ? current.filter((p) => p !== profile)
    : [...current, profile]
  globalState = { ...globalState, activeAccessibilityProfiles: next }
  emit()
}

export function setSelectedPlaceId(id: string) {
  globalState = {
    ...globalState,
    selectedPlaceId: id,
    userViewsCount: globalState.userViewsCount + 1,
    totalVisitors: globalState.totalVisitors + 1,
  }
  emit()
}

export function launchAIWithContext(placeName: string) {
  globalState = {
    ...globalState,
    aiContextPrompt: `Tell me about ${placeName} — history, cultural significance and travel tips.`,
  }
  emit()
}

export function recordUserBooking(placeOrExperienceName: string) {
  const newCount = globalState.userBookingsCount + 1
  const newVisitors = globalState.totalVisitors + 1
  const newTrend = +(globalState.activityTrend + 0.3).toFixed(1)
  const newActivity = {
    id: String(Date.now()),
    text: `New Booking: ${placeOrExperienceName}`,
    time: "Just now",
  }

  globalState = {
    ...globalState,
    userBookingsCount: newCount,
    totalVisitors: newVisitors,
    activityTrend: newTrend,
    recentActivities: [newActivity, ...globalState.recentActivities.slice(0, 4)],
  }
  emit()
}

export function setProviderVerified(verified: boolean, category?: string) {
  globalState = {
    ...globalState,
    providerVerified: verified,
    verifiedCategory: category || globalState.verifiedCategory || "places",
  }
  emit()
}

export function setUserRole(role: UserRole) {
  globalState = { ...globalState, userRole: role }
  emit()
}

export function setSelectedNode(nodeName: string | null) {
  globalState = {
    ...globalState,
    selectedNode: nodeName,
    drillDownPath: nodeName ? ["Zimbabwe", nodeName] : ["Zimbabwe"],
  }
  emit()
}

export function setDrillDownPath(path: string[]) {
  globalState = { ...globalState, drillDownPath: path }
  emit()
}

export function setPlannedRoute(route: PlannedRoute) {
  globalState = { ...globalState, plannedRoute: route }
  emit()
}

export function clearPlannedRoute() {
  globalState = { ...globalState, plannedRoute: null }
  emit()
}

/* ── Hook for React components ── */
export function useZimTourStore(): StoreState {
  const [state, setState] = useState(getZimTourStore())

  useEffect(() => {
    return subscribeZimTourStore(() => setState(getZimTourStore()))
  }, [])

  return state
}
