"use client"

import { img } from "./zimtour-data"

export type AccessProfile = "mobility" | "visual" | "hearing" | "sensory"

export type ReviewItem = {
  id: string
  author: string
  rating: number
  date: string
  comment: string
  avatar: string
  verified: boolean
}

export const PLATFORM_COMMISSION_RATE = 0.03 // System retains 3% policy

export type BookingRecord = {
  id: string
  placeId: string
  placeName: string
  category: string
  touristName: string
  touristEmail: string
  touristPhone: string
  bookingDate: string
  guests: number
  servicePriceUSD: number
  platformCommissionUSD: number // 3% retained by platform
  providerPayoutUSD: number     // 97% disbursed to provider
  totalAmountUSD: number
  paymentMethod: "EcoCash" | "Inntel Pay" | "Visa/Mastercard" | "ZimSwitch"
  status: "Confirmed" | "Completed" | "Cancelled"
  confirmationCode: string
  createdAt: string
}

export type PlaceDetail = {
  id: string
  name: string
  category: "Places" | "Stay" | "Things to Do" | "Get Around" | "Services" | "Experiences" | "Food & Drink" | "Emergency & Health"
  subCategory: string
  location: string
  distanceKm: number
  lat: number
  lng: number
  rating: number
  reviews: number
  seed: string
  imageUrl: string
  desc: string
  entryPrice: string
  tags: string[]
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
  indigenousNarrative?: IndigenousStory
}

export type IndigenousStory = {
  id: string
  placeId: string
  placeName: string
  title: string
  storyteller: string
  format: "audio" | "video" | "text"
  mediaUrl?: string
  duration?: string
  language: "Shona (Karanga)" | "Ndebele" | "English"
  transcript: string
  culturalSignificance: string
  unescoAlignment: string
  dateAdded: string
  verifiedByCommunity: boolean
}

export const INDIGENOUS_CULTURAL_STORIES: IndigenousStory[] = [
  {
    id: "story-gz-1",
    placeId: "great-zimbabwe",
    placeName: "Great Zimbabwe National Monument",
    title: "The Sacred Hungwe Birds & The Spirit Mediums (Svikiro)",
    storyteller: "Sekuru Mubaiwa Haruzivishe (Mugabe/Nemanwa Clan Elder)",
    format: "audio",
    mediaUrl: "https://actions.google.com/sounds/v1/ambiences/outdoor_gentle_breeze.ogg",
    duration: "4 min 25 sec",
    language: "Shona (Karanga)",
    transcript:
      "For centuries before western scholars classified these walls as mere stone ruins, our elders knew Great Zimbabwe as Dzimbahwe — 'The Venerated Houses of Stone'. The carved soapstone birds (Hungwe) were spiritual conductors connecting our living community to Mwari (God) through the Svikiro (spirit mediums). When rainmaking rituals were performed at the Conical Tower, the elders played the Mbira DzaVadzimu and offered rapoko beer.",
    culturalSignificance: "Restores intangible spiritual heritage and indigenous Shona cosmology to Great Zimbabwe.",
    unescoAlignment: "Fulfills UNESCO Decolonial Heritage Management Framework by recording suppressed oral histories.",
    dateAdded: "2 days ago",
    verifiedByCommunity: true,
  },
  {
    id: "story-gz-2",
    placeId: "great-zimbabwe",
    placeName: "Great Zimbabwe National Monument",
    title: "Dry-Stone Architecture Secrets & Mukwerera Rituals",
    storyteller: "Mbuya VaTariro Nemanwa (Hill Complex Custodian)",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "6 min 10 sec",
    language: "Shona (Karanga)",
    transcript:
      "The walls were built without mortar using granite rock flakes split by heating with fire and cooling with water. Our traditional custodians preserved strict taboos protecting the surrounding sacred forests. No tree could be cut from the Hill Complex without asking permission from the ancestors.",
    culturalSignificance: "Traditional ecological knowledge and indigenous engineering methods.",
    unescoAlignment: "Preserves living heritage and community stewardship model recommended by UNESCO.",
    dateAdded: "1 week ago",
    verifiedByCommunity: true,
  },
  {
    id: "story-lm-1",
    placeId: "lake-mutirikwi",
    placeName: "Lake Mutirikwi National Park",
    title: "The Legend of the Njuzu Water Guardians of Mutirikwi",
    storyteller: "VaMasimba Chikwanda (Mutirikwi Community Historian)",
    format: "text",
    language: "English",
    transcript:
      "Before the dam was constructed in 1960, the Mutirikwi river basin contained deep river pools guarded by the Njuzu (water spirits). Local healers (N'anga) underwent sacred retreats beneath the waters. To this day, boat operators on Lake Mutirikwi honor traditional taboos against shouting or whistling near the deep granite gorges.",
    culturalSignificance: "Local riverine lore, aquatic spiritual taboos, and community conservation practices.",
    unescoAlignment: "Documentation of intangible water heritage and local indigenous narratives.",
    dateAdded: "3 days ago",
    verifiedByCommunity: true,
  },
]

export function addIndigenousStory(story: Omit<IndigenousStory, "id" | "dateAdded" | "verifiedByCommunity">): IndigenousStory {
  const newStory: IndigenousStory = {
    ...story,
    id: `story-${Date.now()}`,
    dateAdded: "Just now",
    verifiedByCommunity: true,
  }
  INDIGENOUS_CULTURAL_STORIES.unshift(newStory)
  return newStory
}

/* ── Unified Master Relational Dataset ── */
export const MASTER_DATASET: PlaceDetail[] = [
  {
    id: "great-zimbabwe",
    name: "Great Zimbabwe National Monument",
    category: "Places",
    subCategory: "Heritage Site",
    location: "Masvingo",
    distanceKm: 0.8,
    lat: -20.2674,
    lng: 30.9338,
    rating: 4.8,
    reviews: 230,
    seed: "gzruins2",
    imageUrl: "/zim/great-zimbabwe.png",
    desc: "UNESCO World Heritage site and ancient stone city of the Kingdom of Zimbabwe. Built between the 11th and 15th centuries.",
    entryPrice: "USD 10",
    tags: ["Heritage", "UNESCO", "History"],
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
    ],
    indigenousNarrative: INDIGENOUS_CULTURAL_STORIES[0],
  },
  {
    id: "tugwi-mukosi",
    name: "Tugwi–Mukosi Dam & Ruins",
    category: "Places",
    subCategory: "Heritage & Lake Ruins",
    location: "Masvingo South",
    distanceKm: 28,
    lat: -20.6500,
    lng: 30.9000,
    rating: 4.7,
    reviews: 75,
    seed: "tugwimukosi",
    imageUrl: img("tugwimukosi", 800, 500),
    desc: "Ancient city ruins with rich Shona history, combined with Zimbabwe's largest inland dam reservoir offering breathtaking mountain views and boating.",
    entryPrice: "USD 8",
    tags: ["Ruins", "Lake", "Heritage", "Boating"],
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Easy hiking trails & lakeside road",
      lastVerified: "Today",
    },
    reviewsList: [
      {
        id: "tm1",
        author: "Simbarashe Chitepo",
        rating: 5,
        date: "2 days ago",
        comment: "Spectacular landscape where ancient heritage meets modern water engineering. Magnificent views over the dam wall!",
        avatar: "SC",
        verified: true,
      },
    ],
  },
  {
    id: "singita-pamushana",
    name: "Singita Pamushana Lodge",
    category: "Stay",
    subCategory: "Ultra-Luxury Safari Lodge",
    location: "Malilangwe Reserve, Chiredzi",
    distanceKm: 145,
    lat: -21.0500,
    lng: 31.9000,
    rating: 5.0,
    reviews: 142,
    seed: "singita",
    imageUrl: "/zim/singita.jpeg",
    desc: "Perched high on a sandstone ridge overlooking Malilangwe Wildlife Reserve, Singita Pamushana is an eco-luxury sanctuary known for world-class conservation and safari luxury.",
    entryPrice: "USD 1,650 / night",
    tags: ["5-Star Luxury", "Safari", "Conservation", "Private Pool"],
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Elevated timber walkways & stone terraces",
      lastVerified: "Today",
    },
    reviewsList: [
      {
        id: "sp1",
        author: "Lord Alistair Campbell",
        rating: 5,
        date: "Yesterday",
        comment: "Absolute perfection in the African wilderness. Seeing black rhinos and wild dogs on Malilangwe Dam while dining cliffside was unforgettable.",
        avatar: "AC",
        verified: true,
      },
    ],
  },
  {
    id: "nyuni-mountain-lodge",
    name: "Nyuni Mountain Lodge & Lakeside Resort",
    category: "Stay",
    subCategory: "Mountain & Lake Resort",
    location: "Lake Mutirikwi, Masvingo",
    distanceKm: 32,
    lat: -20.2100,
    lng: 30.9800,
    rating: 4.8,
    reviews: 89,
    seed: "nyuni",
    imageUrl: "/zim/nyuni2.jpg.jpeg",
    desc: "Nestled beneath the majestic Nyuni Hills along the shore of Lake Mutirikwi. Offers luxury lakeside chalets, mountain hiking trails, and boat cruises.",
    entryPrice: "USD 120 / night",
    tags: ["Lake View", "Mountain Hiking", "Chalets", "Boating"],
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Lakeside stone pathways",
      lastVerified: "Today",
    },
    reviewsList: [
      {
        id: "ny1",
        author: "Chipo Mupfumi",
        rating: 5,
        date: "3 days ago",
        comment: "The views of Lake Mutirikwi from the Nyuni Chalet balcony are breathtaking! Highly recommend the morning mountain hike.",
        avatar: "CM",
        verified: true,
      },
    ],
  },
  {
    id: "pokoteke-gorge",
    name: "Pokoteke Gorge & Wilderness Trail",
    category: "Things to Do",
    subCategory: "Nature Walk & Gorge Hike",
    location: "Mutirikwi Basin, Masvingo",
    distanceKm: 29,
    lat: -20.1900,
    lng: 31.0200,
    rating: 4.7,
    reviews: 64,
    seed: "pakoteke",
    imageUrl: "/zim/pakoteke_gorge.jpg.jpeg",
    desc: "Dramatic granite gorge carving through indigenous woodlands. Features crystal-clear river pools, guided gorge treks, and ancient San rock art.",
    entryPrice: "USD 12",
    tags: ["Gorge Trail", "River Walk", "San Rock Art", "Eco-Tour"],
    accessibility: {
      mobility: "partial",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: false,
      parking: true,
      terrain: "Granite gorge rocks & woodland riverbed",
      lastVerified: "2 days ago",
    },
    reviewsList: [
      {
        id: "pg1",
        author: "Kumbirai Zhou",
        rating: 5,
        date: "4 days ago",
        comment: "Stunning untouched nature! The river pools inside Pokoteke Gorge are pristine. Our ranger guide showed us hidden bushman rock paintings.",
        avatar: "KZ",
        verified: true,
      },
    ],
  },
  {
    id: "gonarezhou-national-park",
    name: "Gonarezhou National Park & Chilojo Cliffs",
    category: "Places",
    subCategory: "National Park & Wildlife",
    location: "Chiredzi / Lowveld",
    distanceKm: 180,
    lat: -21.6833,
    lng: 31.9167,
    rating: 4.9,
    reviews: 178,
    seed: "gonarezhou",
    imageUrl: "/zim/gonarezhou.jpg.jpeg",
    desc: "Zimbabwe's second-largest national park, famous for the magnificent red sandstone Chilojo Cliffs towering over the Runde River and vast elephant herds.",
    entryPrice: "USD 20",
    tags: ["Chilojo Cliffs", "Elephants", "Big Game", "Wilderness"],
    accessibility: {
      mobility: "partial",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Sandy riverbanks & unpaved 4x4 tracks",
      lastVerified: "Yesterday",
    },
    reviewsList: [
      {
        id: "gn1",
        author: "Ethan Vance",
        rating: 5,
        date: "5 days ago",
        comment: "Standing at the base of Chilojo Cliffs as elephants crossed the Runde River was a soul-stirring African safari experience.",
        avatar: "EV",
        verified: true,
      },
    ],
  },
  {
    id: "zrp-masvingo-central",
    name: "ZRP Masvingo Central Police Headquarters",
    category: "Emergency & Health",
    subCategory: "Police & Security Station",
    location: "Robert Mugabe Way, Masvingo",
    distanceKm: 2.1,
    lat: -20.0750,
    lng: 30.8333,
    rating: 4.8,
    reviews: 52,
    seed: "zrp-masvingo",
    imageUrl: "/zim/zrp_masvingo.jpeg",
    desc: "Primary Zimbabwe Republic Police (ZRP) central command station for Masvingo Province. Provides 24/7 law enforcement and emergency response.",
    entryPrice: "Free Assistance",
    tags: ["Police", "Security", "24/7 Hotline", "Government"],
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Paved entrance & wheelchair ramp",
      lastVerified: "Today",
    },
    reviewsList: [
      {
        id: "zp1",
        author: "Tendai Mapfumo",
        rating: 5,
        date: "3 days ago",
        comment: "Extremely helpful officers when reporting lost documents. Efficient and reassuring service for visitors.",
        avatar: "TM",
        verified: true,
      },
    ],
  },
  {
    id: "zrp-tourist-protection",
    name: "ZRP Tourist Protection & Highway Patrol Unit",
    category: "Emergency & Health",
    subCategory: "Tourist Protection & Security",
    location: "Masvingo - Great Zimbabwe Corridor",
    distanceKm: 4.5,
    lat: -20.1200,
    lng: 30.8700,
    rating: 4.9,
    reviews: 73,
    seed: "zrp-tourism",
    imageUrl: "/zim/zrp_tourism.jpg.jpeg",
    desc: "Specialized ZRP Tourist Security & Highway Patrol unit safeguarding tourism corridors, heritage sites, and international visitors across Masvingo Province.",
    entryPrice: "Free Hotline Assistance",
    tags: ["Tourist Security", "Highway Patrol", "Escort", "24/7 Response"],
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Level station precinct",
      lastVerified: "Today",
    },
    reviewsList: [
      {
        id: "tp1",
        author: "Sarah Jenkins",
        rating: 5,
        date: "Yesterday",
        comment: "Felt completely safe traveling from Harare to Masvingo. Visible tourist patrol officers at key junctions were very courteous.",
        avatar: "SJ",
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
    lat: -20.2167,
    lng: 30.8833,
    rating: 4.6,
    reviews: 98,
    seed: "lakemutirikwi2",
    imageUrl: img("lakemutirikwi2", 800, 500),
    desc: "Scenic lake views, boating, fishing and bird watching near Kyle Recreational Park.",
    entryPrice: "USD 5",
    tags: ["Nature", "Lake", "Boating"],
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
    lat: -20.1000,
    lng: 30.8500,
    rating: 4.7,
    reviews: 86,
    seed: "culturalexp",
    imageUrl: img("culturalexp", 800, 500),
    desc: "Engage with local communities, learn traditional crafts, music, and Shona storytelling.",
    entryPrice: "USD 15",
    tags: ["Culture", "Crafts", "Guided"],
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
    lat: -20.1833,
    lng: 30.6833,
    rating: 4.4,
    reviews: 42,
    seed: "mushandike",
    imageUrl: img("mushandike", 800, 500),
    desc: "Protected sanctuary offering game drives, bird watching, and quiet nature walks.",
    entryPrice: "USD 8",
    tags: ["Wildlife", "Safari", "Nature"],
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
    lat: -20.2700,
    lng: 30.9350,
    rating: 4.5,
    reviews: 110,
    seed: "localfood",
    imageUrl: img("localfood", 800, 500),
    desc: "Authentic local Zimbabwean cuisine featuring sadza, nyama, and fresh indigenous vegetables.",
    entryPrice: "USD 8 – 15",
    tags: ["Dining", "Local Food", "Cuisine"],
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
    lat: -20.2200,
    lng: 30.8700,
    rating: 4.4,
    reviews: 45,
    seed: "kylepark",
    imageUrl: img("kylepark", 800, 500),
    desc: "Lakeside park with white rhino sanctuary and peaceful picnic spots.",
    entryPrice: "USD 7",
    tags: ["Park", "Rhino", "Picnic"],
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
    lat: -20.0500,
    lng: 30.4667,
    rating: 4.5,
    reviews: 54,
    seed: "hotsprings",
    imageUrl: img("hotsprings", 800, 500),
    desc: "Geothermal hot springs known for relaxing thermal baths and mineral-rich waters.",
    entryPrice: "USD 6",
    tags: ["Thermal", "Relaxation", "Springs"],
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
    lat: -20.3500,
    lng: 30.9000,
    rating: 4.6,
    reviews: 39,
    seed: "mountain",
    imageUrl: img("mountain", 800, 500),
    desc: "Dramatic mountain peaks offering panoramic views over Lake Mutirikwi and valleys.",
    entryPrice: "Free",
    tags: ["Hiking", "Views", "Adventure"],
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
    lat: -20.1000,
    lng: 31.0000,
    rating: 4.3,
    reviews: 31,
    seed: "birdsanctuary",
    imageUrl: img("birdsanctuary", 800, 500),
    desc: "Quiet botanical sanctuary featuring rare indigenous flora and colorful bird species.",
    entryPrice: "USD 5",
    tags: ["Botanic", "Birds", "Peaceful"],
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
    id: "lodge-ancient-city",
    name: "Lodge at Ancient City",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Masvingo",
    distanceKm: 2.5,
    lat: -20.2750,
    lng: 30.9300,
    rating: 4.8,
    reviews: 142,
    seed: "lodgeancientcity",
    imageUrl: img("lodgeancientcity", 800, 500),
    desc: "Luxury safari lodge built into granite boulders overlooking Great Zimbabwe ruins with swimming pool and traditional dining.",
    entryPrice: "USD 120 / night",
    tags: ["Lodge", "Luxury", "Pool", "Ruins View"],
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Granite pathways & ramped dining area",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "lac1",
        author: "Samantha Wright",
        rating: 5,
        date: "2 days ago",
        comment: "Stunning architecture resembling Great Enclosure walls! The sunset over the granite kopjes was unforgettable.",
        avatar: "SW",
        verified: true,
      },
    ],
  },
  {
    id: "regency-flamboyant",
    name: "Regency Hotel Flamboyant",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Masvingo Town",
    distanceKm: 4.2,
    lat: -20.0700,
    lng: 30.8300,
    rating: 4.6,
    reviews: 118,
    seed: "flamboyant",
    imageUrl: img("flamboyant", 800, 500),
    desc: "Premier hotel in central Masvingo featuring lush tropical gardens, conference suites, swimming pool, and fine dining.",
    entryPrice: "USD 85 / night",
    tags: ["Hotel", "Pool", "Central", "WiFi"],
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Flat paved floors & elevator",
      lastVerified: "3 days ago",
    },
    reviewsList: [
      {
        id: "rf1",
        author: "Tendai Mapfumo",
        rating: 5,
        date: "4 days ago",
        comment: "Comfortable rooms, fast Wi-Fi, and top-tier customer service right in the heart of Masvingo town.",
        avatar: "TM",
        verified: true,
      },
    ],
  },
  {
    id: "norma-jeanes-resort",
    name: "Norma Jeane's Lakeview Resort",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Lake Mutirikwi",
    distanceKm: 14,
    lat: -20.2250,
    lng: 30.8950,
    rating: 4.7,
    reviews: 95,
    seed: "normajeanes",
    imageUrl: img("normajeanes", 800, 500),
    desc: "Charming lakeside chalets and landscaped gardens overlooking Lake Mutirikwi dam wall.",
    entryPrice: "USD 70 / night",
    tags: ["Resort", "Lakeview", "Chalets", "Gardens"],
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Garden paths with ramp access",
      lastVerified: "2 days ago",
    },
    reviewsList: [
      {
        id: "nj1",
        author: "Hannah Miller",
        rating: 5,
        date: "5 days ago",
        comment: "Breathtaking lake views and birdwatching from the balcony. Homemade breakfasts were delightful!",
        avatar: "HM",
        verified: true,
      },
    ],
  },
  {
    id: "mutirikwi-boat-cruise",
    name: "Lake Mutirikwi Sunset Cruise & Bass Fishing",
    category: "Experiences",
    subCategory: "Tours & Activities",
    location: "Lake Mutirikwi",
    distanceKm: 24,
    lat: -20.2180,
    lng: 30.8850,
    rating: 4.8,
    reviews: 78,
    seed: "boatcruise",
    imageUrl: img("boatcruise", 800, 500),
    desc: "Guided pontoon boat cruises across Lake Mutirikwi featuring bass fishing equipment and complimentary sundowner refreshments.",
    entryPrice: "USD 25 / person",
    tags: ["Boat Cruise", "Sunset", "Fishing", "Guided"],
    accessibility: {
      mobility: "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Ramped jetty to boat deck",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "mbc1",
        author: "Farai Moyo",
        rating: 5,
        date: "1 day ago",
        comment: "Watching the sun set over Lake Mutirikwi with hippo sightings in the bay was spectacular!",
        avatar: "FM",
        verified: true,
      },
    ],
  },
  {
    id: "great-zim-guided-tour",
    name: "Great Zimbabwe UNESCO Archaeological Walk",
    category: "Experiences",
    subCategory: "Tours & Activities",
    location: "Masvingo",
    distanceKm: 0.8,
    lat: -20.2674,
    lng: 30.9338,
    rating: 4.9,
    reviews: 165,
    seed: "archaeo",
    imageUrl: img("archaeo", 800, 500),
    desc: "Official 2-hour guided historical walk through the Hill Complex, Great Enclosure, and Shona Heritage Museum with expert historians.",
    entryPrice: "USD 15 / person",
    tags: ["Guided Tour", "History", "Archaeology"],
    accessibility: {
      mobility: "partial",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Historical stone pathways",
      lastVerified: "2 days ago",
    },
    reviewsList: [
      {
        id: "gzgt1",
        author: "Dr. Arthur Vance",
        rating: 5,
        date: "3 days ago",
        comment: "Our guide gave an extraordinary depth of knowledge on ancient Shona architecture and royal lineage.",
        avatar: "AV",
        verified: true,
      },
    ],
  },
  {
    id: "masvingo-car-rental",
    name: "Masvingo 4x4 Car Rental & Airport Shuttle",
    category: "Services",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo City",
    distanceKm: 3.5,
    lat: -20.0650,
    lng: 30.8350,
    rating: 4.7,
    reviews: 64,
    seed: "carhire",
    imageUrl: img("carhire", 800, 500),
    desc: "Reliable self-drive SUV & 4x4 safari rentals, chauffeur drive, and airport transfers connecting Masvingo to Harare & Bulawayo.",
    entryPrice: "USD 45 / day",
    tags: ["Car Hire", "4x4", "Shuttle", "Airport Transfer"],
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Flat paved office",
      lastVerified: "1 day ago",
    },
    reviewsList: [
      {
        id: "mcr1",
        author: "Peter Davies",
        rating: 5,
        date: "2 days ago",
        comment: "Punctual airport pickup and the 4x4 Fortuner was in pristine condition for our trip to Gonarezhou.",
        avatar: "PD",
        verified: true,
      },
    ],
  },
  {
    id: "chevange-craft-village",
    name: "Masvingo Curio & Shona Craft Village",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo",
    distanceKm: 5.0,
    lat: -20.0800,
    lng: 30.8400,
    rating: 4.6,
    reviews: 82,
    seed: "craftmarket",
    imageUrl: img("craftmarket", 800, 500),
    desc: "Open-air artisan market featuring authentic soapstone sculptures, woven baskets, beadwork, and traditional Shona curios.",
    entryPrice: "Free Entry",
    tags: ["Shopping", "Crafts", "Sculptures", "Souvenirs"],
    accessibility: {
      mobility: "full",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Flat paved market stalls",
      lastVerified: "3 days ago",
    },
    reviewsList: [
      {
        id: "ccv1",
        author: "Emily Taylor",
        rating: 5,
        date: "4 days ago",
        comment: "Bought stunning hand-carved verdite stone birds directly from local master sculptors at great prices!",
        avatar: "ET",
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
    lat: -21.2850,
    lng: 32.2450,
    rating: 4.9,
    reviews: 78,
    seed: "gorgelodge",
    imageUrl: img("gorgelodge", 800, 500),
    desc: "Overlooking the Save River and cliffside wilderness views near Gonarezhou.",
    entryPrice: "USD 45",
    tags: ["Lodge", "Safari", "River View"],
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

  // ── MORE STAY (Hotels & Lodges) ──
  {
    id: "great-zimbabwe-hotel",
    name: "Great Zimbabwe Hotel (RTG)",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Great Zimbabwe Grounds",
    distanceKm: 0.5,
    lat: -20.2680,
    lng: 30.9250,
    rating: 4.7,
    reviews: 156,
    seed: "greatzimhotel",
    imageUrl: img("greatzimhotel", 800, 500),
    desc: "Historic Rainbow Tourism Group hotel situated adjacent to Great Zimbabwe World Heritage Site with swimming pool and cocktail bar.",
    entryPrice: "USD 95 / night",
    tags: ["Hotel", "Heritage Adjacent", "Pool", "Restaurant"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Paved garden walkways", lastVerified: "1 day ago" },
    reviewsList: [{ id: "gzh1", author: "Farai T.", rating: 5, date: "2 days ago", comment: "Literally a 3 minute walk from Great Zimbabwe gate. Great breakfast buffet!", avatar: "FT", verified: true }]
  },
  {
    id: "chevron-hotel",
    name: "Chevron Hotel Masvingo",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Masvingo City Center",
    distanceKm: 4.0,
    lat: -20.0750,
    lng: 30.8320,
    rating: 4.5,
    reviews: 110,
    seed: "chevronhotel",
    imageUrl: img("chevronhotel", 800, 500),
    desc: "Iconic central city hotel with spacious suites, conference halls, bar lounge, and easy access to local banks and shops.",
    entryPrice: "USD 75 / night",
    tags: ["Hotel", "City Center", "WiFi", "Conference"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Flat elevator access", lastVerified: "2 days ago" },
    reviewsList: [{ id: "ch1", author: "Blessing M.", rating: 4, date: "4 days ago", comment: "Very central location in Masvingo town, clean rooms and friendly staff.", avatar: "BM", verified: true }]
  },
  {
    id: "clevers-lakeview",
    name: "Clevers Lakeview Resort",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Lake Mutirikwi",
    distanceKm: 16.5,
    lat: -20.2300,
    lng: 30.8800,
    rating: 4.6,
    reviews: 88,
    seed: "cleversresort",
    imageUrl: img("cleversresort", 800, 500),
    desc: "Relaxing waterside lodge featuring self-catering family cottages, private boat slipway, and lakefront braai spots.",
    entryPrice: "USD 65 / night",
    tags: ["Resort", "Self-Catering", "Lake Access", "Boating"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Lawn pathways to lake", lastVerified: "3 days ago" },
    reviewsList: [{ id: "clr1", author: "Nyasha Z.", rating: 5, date: "3 days ago", comment: "Perfect for family weekend fishing trips on Lake Mutirikwi!", avatar: "NZ", verified: true }]
  },
  {
    id: "simba-executive-lodge",
    name: "Simba Executive Lodge",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Masvingo Target Kopje",
    distanceKm: 4.8,
    lat: -20.0820,
    lng: 30.8400,
    rating: 4.4,
    reviews: 62,
    seed: "simbalodge",
    imageUrl: img("simbalodge", 800, 500),
    desc: "Hilltop executive lodge offering panoramic city and hill views over Masvingo, quiet rooms, and private dining.",
    entryPrice: "USD 55 / night",
    tags: ["Lodge", "Panoramic View", "Executive", "Quiet"],
    accessibility: { mobility: "partial", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Sloped driveway", lastVerified: "5 days ago" },
    reviewsList: [{ id: "sel1", author: "David K.", rating: 4, date: "1 week ago", comment: "Great sunset view over Masvingo city from the balcony.", avatar: "DK", verified: true }]
  },
  {
    id: "kyle-park-chalets",
    name: "Kyle Recreational Park ZimParks Chalets",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Lake Mutirikwi National Park",
    distanceKm: 18.0,
    lat: -20.2210,
    lng: 30.8720,
    rating: 4.5,
    reviews: 94,
    seed: "kylechalets",
    imageUrl: img("kylechalets", 800, 500),
    desc: "Official ZimParks national park thatched chalets surrounded by wild rhinos, impalas, and lush parklands.",
    entryPrice: "USD 40 / night",
    tags: ["ZimParks", "Nature Chalets", "Wildlife", "Budget"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Grassy park ground", lastVerified: "2 days ago" },
    reviewsList: [{ id: "kpc1", author: "Claire B.", rating: 5, date: "4 days ago", comment: "Woke up with zebras grazing right outside our chalet door!", avatar: "CB", verified: true }]
  },
  {
    id: "ancient-city-tented-camp",
    name: "Ancient City Luxury Tented Camp",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Masvingo Valley",
    distanceKm: 2.8,
    lat: -20.2770,
    lng: 30.9320,
    rating: 4.8,
    reviews: 74,
    seed: "tentedcamp",
    imageUrl: img("tentedcamp", 800, 500),
    desc: "Glamping canvas safari tents equipped with en-suite bathrooms, king beds, and open-air starlit dining.",
    entryPrice: "USD 80 / night",
    tags: ["Glamping", "Safari Tents", "Luxury", "Stargazing"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Decked canvas platforms", lastVerified: "1 day ago" },
    reviewsList: [{ id: "act1", author: "Mark E.", rating: 5, date: "2 days ago", comment: "Unbeatable glamping under the African stars near Great Zimbabwe.", avatar: "ME", verified: true }]
  },
  {
    id: "urban-breeze-hotel",
    name: "Urban Breeze Hotel & Executive Suites",
    category: "Stay",
    subCategory: "Hotels & Lodges",
    location: "Masvingo East",
    distanceKm: 3.8,
    lat: -20.0680,
    lng: 30.8360,
    rating: 4.5,
    reviews: 58,
    seed: "urbanbreeze",
    imageUrl: img("urbanbreeze", 800, 500),
    desc: "Boutique hotel tailored for business travelers and tourists, featuring modern air-conditioned rooms and fast fiber internet.",
    entryPrice: "USD 60 / night",
    tags: ["Boutique Hotel", "Modern", "WiFi", "AC"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Flat ramp access", lastVerified: "3 days ago" },
    reviewsList: [{ id: "ubh1", author: "Tariro M.", rating: 5, date: "5 days ago", comment: "Super clean modern room with cold AC and quick check-in.", avatar: "TM", verified: true }]
  },

  // ── MORE THINGS TO DO (Tours & Activities) ──
  {
    id: "kyle-game-drive",
    name: "Kyle National Park 4x4 Rhino Safari Drive",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Kyle Recreational Park",
    distanceKm: 18.0,
    lat: -20.2200,
    lng: 30.8700,
    rating: 4.8,
    reviews: 140,
    seed: "gamedrive",
    imageUrl: img("gamedrive", 800, 500),
    desc: "Guided 3-hour open 4x4 game drive through Kyle National Park with high probability white rhino, buffalo, and giraffe tracking.",
    entryPrice: "USD 30 / person",
    tags: ["Safari Drive", "White Rhino", "4x4", "Wildlife"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Open safari vehicle", lastVerified: "1 day ago" },
    reviewsList: [{ id: "kgd1", author: "John D.", rating: 5, date: "1 day ago", comment: "Saw 4 white rhinos up close with our ZimParks ranger!", avatar: "JD", verified: true }]
  },
  {
    id: "shona-drumming-exp",
    name: "Shona Cultural Village Drumming & Storytelling Night",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Masvingo Cultural Village",
    distanceKm: 8.0,
    lat: -20.1000,
    lng: 30.8500,
    rating: 4.9,
    reviews: 98,
    seed: "drumming",
    imageUrl: img("drumming", 800, 500),
    desc: "Evening campfire experience featuring traditional mbira music, Shona drumming workshops, and ancestral folk tales.",
    entryPrice: "USD 18 / person",
    tags: ["Culture", "Mbira Music", "Storytelling", "Campfire"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Flat courtyard", lastVerified: "2 days ago" },
    reviewsList: [{ id: "sde1", author: "Elena R.", rating: 5, date: "3 days ago", comment: "Hypnotic mbira music and warm hospitality around the boma fire.", avatar: "ER", verified: true }]
  },
  {
    id: "great-enclosure-photo",
    name: "Great Enclosure Sunset Guided Photography Tour",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Great Zimbabwe Monument",
    distanceKm: 0.8,
    lat: -20.2670,
    lng: 30.9340,
    rating: 4.9,
    reviews: 82,
    seed: "photoexp",
    imageUrl: img("photoexp", 800, 500),
    desc: "Exclusive golden hour photography tour capturing the iconic Conical Tower and ancient dry stone walls at dusk.",
    entryPrice: "USD 20 / person",
    tags: ["Photography", "Sunset", "Heritage", "Guided"],
    accessibility: { mobility: "partial", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Stone pathways", lastVerified: "2 days ago" },
    reviewsList: [{ id: "gep1", author: "Lucas V.", rating: 5, date: "4 days ago", comment: "The lighting on the stone walls during sunset was magnificent for photos!", avatar: "LV", verified: true }]
  },
  {
    id: "mutirikwi-dam-walk",
    name: "Mutirikwi Dam Wall & Heritage Engineering Walk",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Lake Mutirikwi Dam",
    distanceKm: 15.0,
    lat: -20.2350,
    lng: 30.8980,
    rating: 4.5,
    reviews: 64,
    seed: "damwalk",
    imageUrl: img("damwalk", 800, 500),
    desc: "Guided walking tour along the historic 1960 concrete arch dam wall overlooking the spillway and deep gorge.",
    entryPrice: "USD 5 / person",
    tags: ["Dam Walk", "Engineering", "Views", "Heritage"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Paved dam crest walkway", lastVerified: "4 days ago" },
    reviewsList: [{ id: "mdw1", author: "Kudzai B.", rating: 5, date: "1 week ago", comment: "Spectacular views down into the gorge from the dam wall!", avatar: "KB", verified: true }]
  },
  {
    id: "mushandike-walking-safari",
    name: "Mushandike Wilderness Ranger Trail Walk",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Mushandike Sanctuary",
    distanceKm: 28.0,
    lat: -20.1833,
    lng: 30.6833,
    rating: 4.7,
    reviews: 52,
    seed: "walkingsafari",
    imageUrl: img("walkingsafari", 800, 500),
    desc: "Guided eco walking safari through bush trails with ZimParks armed rangers tracking antelopes, zebras, and bird nesting grounds.",
    entryPrice: "USD 12 / person",
    tags: ["Walking Safari", "Ranger Guided", "Nature", "Eco"],
    accessibility: { mobility: "partial", visual: false, hearing: true, sensory: true, facilities: false, parking: true, terrain: "Dirt trail", lastVerified: "5 days ago" },
    reviewsList: [{ id: "mws1", author: "Sarah P.", rating: 5, date: "6 days ago", comment: "Walking on foot with wild antelopes is so much more thrilling than driving!", avatar: "SP", verified: true }]
  },
  {
    id: "mashava-thermal-bath",
    name: "Mashava Geothermal Mineral Springs Bath",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Mashava Springs",
    distanceKm: 42.0,
    lat: -20.0500,
    lng: 30.4667,
    rating: 4.6,
    reviews: 70,
    seed: "thermalbath",
    imageUrl: img("thermalbath", 800, 500),
    desc: "Natural geothermal warm water pools rich in therapeutic minerals. Outdoor bathing stalls and picnic lawns.",
    entryPrice: "USD 10 / person",
    tags: ["Hot Springs", "Thermal Pool", "Relaxation", "Wellness"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ramped pools", lastVerified: "2 days ago" },
    reviewsList: [{ id: "mtb1", author: "Tendai C.", rating: 5, date: "3 days ago", comment: "Warm natural thermal waters completely cured our post-hike sore muscles!", avatar: "TC", verified: true }]
  },
  {
    id: "nyuni-mountain-trek",
    name: "Nyuni Mountain Ridge Summit Trek",
    category: "Things to Do",
    subCategory: "Tours & Activities",
    location: "Nyuni Range",
    distanceKm: 48.0,
    lat: -20.3500,
    lng: 30.9000,
    rating: 4.8,
    reviews: 46,
    seed: "mountaintrek",
    imageUrl: img("mountaintrek", 800, 500),
    desc: "Half-day guided mountain trek to the highest peak overlooking the Lake Mutirikwi basin with wild flora sightings.",
    entryPrice: "USD 15 / person",
    tags: ["Hiking", "Mountain Trek", "Panoramic View", "Summit"],
    accessibility: { mobility: "none", visual: false, hearing: true, sensory: true, facilities: false, parking: true, terrain: "Steep rocky trail", lastVerified: "6 days ago" },
    reviewsList: [{ id: "nmt1", author: "Brian N.", rating: 5, date: "1 week ago", comment: "Highest vantage point over Masvingo! Incredible panoramic scenery.", avatar: "BN", verified: true }]
  },

  // ── MORE GET AROUND (Car Hire & Travel Info) ──
  {
    id: "impala-transfers-masvingo",
    name: "Impala Express Chauffeur & Safari Vehicle Hire",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo Town",
    distanceKm: 4.0,
    lat: -20.0720,
    lng: 30.8310,
    rating: 4.8,
    reviews: 92,
    seed: "impalacar",
    imageUrl: img("impalacar", 800, 500),
    desc: "Executive chauffeur drive, air-conditioned minibus hire, and custom 4x4 land cruisers for national park excursions.",
    entryPrice: "USD 50 / day",
    tags: ["Car Hire", "Chauffeur", "Safari Cruiser", "Transfers"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Flat office", lastVerified: "1 day ago" },
    reviewsList: [{ id: "itm1", author: "David S.", rating: 5, date: "2 days ago", comment: "The 4x4 Land Cruiser with pop-up roof made our game drive effortless!", avatar: "DS", verified: true }]
  },
  {
    id: "masvingo-harare-shuttle",
    name: "Masvingo Intercity Express Airport Shuttle",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo Transport Hub",
    distanceKm: 3.8,
    lat: -20.0690,
    lng: 30.8330,
    rating: 4.7,
    reviews: 120,
    seed: "shuttlebus",
    imageUrl: img("shuttlebus", 800, 500),
    desc: "Scheduled daily luxury shuttle van service running between Masvingo city center, Robert Gabriel Mugabe Airport (Harare), and Bulawayo.",
    entryPrice: "USD 20 / seat",
    tags: ["Airport Shuttle", "Intercity", "AC Minibus", "Daily"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Low step entrance", lastVerified: "1 day ago" },
    reviewsList: [{ id: "mhs1", author: "Grace P.", rating: 5, date: "1 day ago", comment: "Reliable time schedule, cold AC, and free onboard Wi-Fi to Harare.", avatar: "GP", verified: true }]
  },
  {
    id: "zimroutes-coach",
    name: "ZimRoutes Executive Coach Terminal",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo Main Terminal",
    distanceKm: 4.5,
    lat: -20.0760,
    lng: 30.8290,
    rating: 4.5,
    reviews: 145,
    seed: "coach",
    imageUrl: img("coach", 800, 500),
    desc: "Long-distance luxury coach service connecting Masvingo to Victoria Falls, Mutare, Beitbridge, and Harare.",
    entryPrice: "USD 15 / seat",
    tags: ["Coach Travel", "Intercity", "Reclining Seats", "Express"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Paved bus bay", lastVerified: "2 days ago" },
    reviewsList: [{ id: "zrc1", author: "Tariro M.", rating: 4, date: "3 days ago", comment: "Smooth ride on the express coach from Harare to Masvingo.", avatar: "TM", verified: true }]
  },
  {
    id: "great-zim-taxi",
    name: "Great Zimbabwe Heritage Taxi & Cab Network",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo to Monument Route",
    distanceKm: 1.0,
    lat: -20.2650,
    lng: 30.9300,
    rating: 4.6,
    reviews: 78,
    seed: "towncab",
    imageUrl: img("towncab", 800, 500),
    desc: "Local licensed taxi network running 24/7 direct trips between Masvingo town hotels and Great Zimbabwe National Monument.",
    entryPrice: "USD 10 / trip",
    tags: ["Taxi", "Local Cab", "24/7", "Heritage Route"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Door-to-door pickup", lastVerified: "1 day ago" },
    reviewsList: [{ id: "gzt1", author: "Jean P.", rating: 5, date: "4 days ago", comment: "Driver was waiting at our hotel right on time and gave us great local tips!", avatar: "JP", verified: true }]
  },
  {
    id: "citycab-masvingo",
    name: "CityCab Masvingo Urban Express Cabs",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo Central",
    distanceKm: 4.1,
    lat: -20.0710,
    lng: 30.8340,
    rating: 4.5,
    reviews: 66,
    seed: "citycab",
    imageUrl: img("citycab", 800, 500),
    desc: "Fast urban cab dispatch service for quick in-town trips, restaurant visits, and hotel connections in Masvingo.",
    entryPrice: "USD 8 / trip",
    tags: ["City Cab", "Urban Taxi", "On Demand", "Cheap"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Street pickup", lastVerified: "3 days ago" },
    reviewsList: [{ id: "ccm1", author: "Rudo M.", rating: 5, date: "2 days ago", comment: "Very quick 5-minute pickup service in town.", avatar: "RM", verified: true }]
  },
  {
    id: "avis-masvingo-desk",
    name: "Avis & Budget Car Rental Masvingo Airport Desk",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo Airport Road",
    distanceKm: 6.5,
    lat: -20.0580,
    lng: 30.8600,
    rating: 4.7,
    reviews: 54,
    seed: "avisrental",
    imageUrl: img("avisrental", 800, 500),
    desc: "International brand car hire offering compact sedans, SUVs, and insurance coverage with full drop-off options across Zimbabwe.",
    entryPrice: "USD 55 / day",
    tags: ["Car Rental", "International", "SUV", "Unlimited Mileage"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ramped terminal", lastVerified: "2 days ago" },
    reviewsList: [{ id: "amd1", author: "Peter D.", rating: 5, date: "5 days ago", comment: "Smooth rental pickup and pristine car condition.", avatar: "PD", verified: true }]
  },
  {
    id: "jetty-lake-ferry",
    name: "Mutirikwi Lake Water Taxi & Island Ferry",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Lake Mutirikwi Jetty",
    distanceKm: 16.0,
    lat: -20.2200,
    lng: 30.8820,
    rating: 4.8,
    reviews: 42,
    seed: "jettyshuttle",
    imageUrl: img("jettyshuttle", 800, 500),
    desc: "Water transport shuttle crossing Lake Mutirikwi between lakeside resorts, picnic bays, and fishing spots.",
    entryPrice: "USD 12 / trip",
    tags: ["Water Taxi", "Lake Ferry", "Scenic", "Jetty Shuttle"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Boarding jetty", lastVerified: "1 day ago" },
    reviewsList: [{ id: "jlf1", author: "Hannah M.", rating: 5, date: "3 days ago", comment: "Fun scenic boat ride across the lake to Norma Jeane's resort!", avatar: "HM", verified: true }]
  },
  {
    id: "masvingo-camper-4x4",
    name: "Masvingo Overland Expedition 4x4 Camper Hire",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo West",
    distanceKm: 5.2,
    lat: -20.0640,
    lng: 30.8380,
    rating: 4.9,
    reviews: 38,
    seed: "camper4x4",
    imageUrl: img("camper4x4", 800, 500),
    desc: "Fully equipped 4WD Toyota Hilux campers with rooftop tents, fridge, water tanks, and camping gear for overland safaris.",
    entryPrice: "USD 90 / day",
    tags: ["Overland 4x4", "Rooftop Tent", "Camping Gear", "Safari Ready"],
    accessibility: { mobility: "partial", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Garage depot", lastVerified: "4 days ago" },
    reviewsList: [{ id: "mc41", author: "Lucas V.", rating: 5, date: "1 week ago", comment: "Best 4x4 overland setup for exploring Gonarezhou and Great Zimbabwe!", avatar: "LV", verified: true }]
  },
  {
    id: "hop-on-heritage-shuttle",
    name: "Masvingo Heritage Hop-On Tourist Shuttle",
    category: "Get Around",
    subCategory: "Car Hire & Travel Info",
    location: "Masvingo Circuit",
    distanceKm: 4.0,
    lat: -20.0700,
    lng: 30.8350,
    rating: 4.6,
    reviews: 72,
    seed: "hoponshuttle",
    imageUrl: img("hoponshuttle", 800, 500),
    desc: "Circular tourist shuttle bus looping every 45 mins between Masvingo town hotels, craft market, and Great Zimbabwe entrance.",
    entryPrice: "USD 10 / day pass",
    tags: ["Tourist Bus", "Hop-On Hop-Off", "Day Pass", "Heritage Circuit"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ramped bus entrance", lastVerified: "2 days ago" },
    reviewsList: [{ id: "hhs1", author: "Samantha W.", rating: 5, date: "4 days ago", comment: "Super convenient way to travel back and forth between town and ruins all day.", avatar: "SW", verified: true }]
  },

  // ── MORE SERVICES (Dining & Shopping) ──
  {
    id: "chevron-dining",
    name: "Chevron Terrace Garden Restaurant & Bar",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo City Center",
    distanceKm: 4.0,
    lat: -20.0750,
    lng: 30.8320,
    rating: 4.6,
    reviews: 95,
    seed: "chevrondining",
    imageUrl: img("chevrondining", 800, 500),
    desc: "Shaded garden terrace serving steaks, fresh bream fish from Lake Mutirikwi, cocktails, and espresso coffee.",
    entryPrice: "USD 12 – 25",
    tags: ["Dining", "Garden Terrace", "Steaks", "Bar"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Flat garden dining", lastVerified: "1 day ago" },
    reviewsList: [{ id: "cd1", author: "Tariro M.", rating: 5, date: "3 days ago", comment: "The grilled bream with garlic chips on the terrace was amazing!", avatar: "TM", verified: true }]
  },
  {
    id: "nandos-masvingo",
    name: "Nando's Masvingo Drive-Thru & Flame Grill",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo Town",
    distanceKm: 3.9,
    lat: -20.0730,
    lng: 30.8315,
    rating: 4.7,
    reviews: 135,
    seed: "nandos",
    imageUrl: img("nandos", 800, 500),
    desc: "World-famous PERi-PERi flame-grilled chicken, spicy rice, chips, and quick drive-thru service in central Masvingo.",
    entryPrice: "USD 6 – 18",
    tags: ["Nando's", "PERi-PERi", "Drive-Thru", "Fast Casual"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Level floor & drive-thru", lastVerified: "1 day ago" },
    reviewsList: [{ id: "nm1", author: "Blessing S.", rating: 5, date: "2 days ago", comment: "Hot PERi-PERi half chicken with spicy rice! Always delicious.", avatar: "BS", verified: true }]
  },
  {
    id: "picknpay-masvingo",
    name: "TM Pick n Pay Masvingo Supermarket Hub",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo Town Center",
    distanceKm: 4.1,
    lat: -20.0715,
    lng: 30.8335,
    rating: 4.6,
    reviews: 160,
    seed: "supermarket",
    imageUrl: img("supermarket", 800, 500),
    desc: "Full-service modern supermarket offering fresh bakery items, travel snacks, bottled water, toiletries, and SIM card top-ups.",
    entryPrice: "USD 2 – 50",
    tags: ["Supermarket", "Groceries", "Bakery", "Travel Gear"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Automatic doors & wide aisles", lastVerified: "1 day ago" },
    reviewsList: [{ id: "pnp1", author: "Kudzai B.", rating: 5, date: "1 day ago", comment: "Stocked up on water and snacks before heading out to Great Zimbabwe.", avatar: "KB", verified: true }]
  },
  {
    id: "leather-craft-workshop",
    name: "Pamberi Leather Craft & Souvenir Depot",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo Industrial",
    distanceKm: 4.8,
    lat: -20.0780,
    lng: 30.8390,
    rating: 4.8,
    reviews: 44,
    seed: "leathercraft",
    imageUrl: img("leathercraft", 800, 500),
    desc: "Artisanal leather workshop crafting genuine leather travel bags, belts, safari boots, and custom brass souvenirs.",
    entryPrice: "USD 10 – 60",
    tags: ["Leather Craft", "Handmade", "Souvenirs", "Artisan"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Paved showroom floor", lastVerified: "3 days ago" },
    reviewsList: [{ id: "lcw1", author: "Elena R.", rating: 5, date: "5 days ago", comment: "Bought a gorgeous handmade leather safari tote bag!", avatar: "ER", verified: true }]
  },
  {
    id: "heritage-coffee-bistro",
    name: "Masvingo Heritage Coffee & Artisanal Bistro",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo Town",
    distanceKm: 3.7,
    lat: -20.0705,
    lng: 30.8325,
    rating: 4.8,
    reviews: 76,
    seed: "coffeebistro",
    imageUrl: img("coffeebistro", 800, 500),
    desc: "Cozy specialty coffee bar roasting local Eastern Highlands beans, serving cappuccinos, pastries, and fresh wraps.",
    entryPrice: "USD 3 – 12",
    tags: ["Coffee Bar", "Espresso", "Bistro", "WiFi"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Street level access", lastVerified: "1 day ago" },
    reviewsList: [{ id: "hcb1", author: "David S.", rating: 5, date: "2 days ago", comment: "Best cappuccino and cinnamon rolls in Masvingo! Fast Wi-Fi too.", avatar: "DS", verified: true }]
  },
  {
    id: "totalenergies-hub",
    name: "TotalEnergies Highway Service Hub & EV Stop",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo North Highway",
    distanceKm: 6.0,
    lat: -20.0550,
    lng: 30.8200,
    rating: 4.6,
    reviews: 88,
    seed: "totalenergies",
    imageUrl: img("totalenergies", 800, 500),
    desc: "24-hour service station with high-speed EV charger, Bonjour coffee shop, clean restrooms, and tire care depot.",
    entryPrice: "USD 5 – 30",
    tags: ["Fuel Station", "24/7", "EV Charger", "Bonjour Cafe"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Paved forecourt", lastVerified: "1 day ago" },
    reviewsList: [{ id: "teh1", author: "Peter D.", rating: 5, date: "3 days ago", comment: "Super clean toilets, hot coffee, and fast fuel service on the highway.", avatar: "PD", verified: true }]
  },
  {
    id: "zimcraft-basketry",
    name: "ZimCraft Women Basketry & Weaving Depot",
    category: "Services",
    subCategory: "Dining & Shopping",
    location: "Masvingo Crafts",
    distanceKm: 5.2,
    lat: -20.0820,
    lng: 30.8410,
    rating: 4.9,
    reviews: 50,
    seed: "basketry",
    imageUrl: img("basketry", 800, 500),
    desc: "Fairtrade collective selling handwoven ilala palm baskets, wall decor, and colorful traditional mats made by local women artisans.",
    entryPrice: "USD 8 – 40",
    tags: ["Fairtrade", "Baskets", "Weaving", "Women Artisan"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ground level showroom", lastVerified: "2 days ago" },
    reviewsList: [{ id: "zbw1", author: "Grace P.", rating: 5, date: "4 days ago", comment: "Empowering local women and the basketry patterns are world-class!", avatar: "GP", verified: true }]
  },

  // ── EMERGENCY & HEALTH (Hospitals, Police, Clinics, Rescue) ──
  {
    id: "masvingo-provincial-hospital",
    name: "Masvingo Provincial Referral Hospital",
    category: "Emergency & Health",
    subCategory: "Public Hospital & ER",
    location: "Standish Road, Masvingo",
    distanceKm: 4.2,
    lat: -20.0760,
    lng: 30.8240,
    rating: 4.5,
    reviews: 140,
    seed: "provincialhospital",
    imageUrl: img("provincialhospital", 800, 500),
    desc: "24/7 main government referral hospital in Masvingo province featuring emergency casualty ward, trauma care, and ambulance response.",
    entryPrice: "24/7 ER Service (+263 39 226 2112)",
    tags: ["Emergency ER", "Hospital", "24/7", "Trauma Unit"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ramped ambulance bay & elevator", lastVerified: "1 day ago" },
    reviewsList: [{ id: "mph1", author: "Dr. Moyo", rating: 5, date: "1 day ago", comment: "24-hour casualty unit with dedicated trauma staff.", avatar: "DM", verified: true }]
  },
  {
    id: "zrp-masvingo-town",
    name: "ZRP Masvingo Central Police Station",
    category: "Emergency & Health",
    subCategory: "Police & Security",
    location: "Hughes St & Hofmeyer St, Masvingo",
    distanceKm: 4.0,
    lat: -20.0740,
    lng: 30.8320,
    rating: 4.7,
    reviews: 110,
    seed: "policehq",
    imageUrl: img("policehq", 800, 500),
    desc: "Main Republic Police headquarters in Masvingo town for incident reporting, emergency dispatch, and public safety assistance.",
    entryPrice: "Hotline: 995 / +263 39 226 2222",
    tags: ["Police Station", "Emergency Dispatch", "Security", "24/7 Hotline"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Street level entrance", lastVerified: "1 day ago" },
    reviewsList: [{ id: "zrp1", author: "Inspector Ndlovu", rating: 5, date: "2 days ago", comment: "Fast dispatch for tourist assistance and emergency reports.", avatar: "IN", verified: true }]
  },
  {
    id: "morningside-clinic",
    name: "Morningside Medical Clinic Masvingo",
    category: "Emergency & Health",
    subCategory: "Urgent Care & Clinic",
    location: "Morningside, Masvingo",
    distanceKm: 4.6,
    lat: -20.0810,
    lng: 30.8280,
    rating: 4.8,
    reviews: 85,
    seed: "morningsideclinic",
    imageUrl: img("morningsideclinic", 800, 500),
    desc: "Modern private outpatient clinic providing urgent medical care, general doctor consultations, and lab diagnostics.",
    entryPrice: "Consultation (+263 39 226 4400)",
    tags: ["Private Clinic", "Urgent Care", "Doctors", "Laboratory"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Level clinic entrance", lastVerified: "2 days ago" },
    reviewsList: [{ id: "mc1", author: "Tariro M.", rating: 5, date: "3 days ago", comment: "Extremely clean private clinic, minimal waiting time.", avatar: "TM", verified: true }]
  },
  {
    id: "masvingo-fire-brigade",
    name: "Masvingo Fire & Emergency Rescue HQ",
    category: "Emergency & Health",
    subCategory: "Fire & Rescue Services",
    location: "Civic Centre, Masvingo",
    distanceKm: 3.9,
    lat: -20.0710,
    lng: 30.8330,
    rating: 4.9,
    reviews: 65,
    seed: "firebrigade",
    imageUrl: img("firebrigade", 800, 500),
    desc: "Municipal emergency fire brigade and road accident rescue unit providing 24/7 rapid response across Masvingo district.",
    entryPrice: "Emergency Toll-Free: 999",
    tags: ["Fire Brigade", "Rescue Unit", "999 Emergency", "Accident Response"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Paved station forecourt", lastVerified: "1 day ago" },
    reviewsList: [{ id: "mfb1", author: "Chief Officer", rating: 5, date: "1 day ago", comment: "Immediate 999 callout for highway accident rescue.", avatar: "CO", verified: true }]
  },
  {
    id: "zrp-tourist-police",
    name: "ZRP Tourist Security & Heritage Police Desk",
    category: "Emergency & Health",
    subCategory: "Police & Security",
    location: "Great Zimbabwe Site Office",
    distanceKm: 0.8,
    lat: -20.2660,
    lng: 30.9310,
    rating: 4.9,
    reviews: 78,
    seed: "touristpolice",
    imageUrl: img("touristpolice", 800, 500),
    desc: "Dedicated tourist security post stationed directly at Great Zimbabwe National Monument for visitor safety and assistance.",
    entryPrice: "On-Site Police Post (Free Assistance)",
    tags: ["Tourist Police", "Heritage Security", "On-Site Post", "Visitor Safety"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ramped site office", lastVerified: "1 day ago" },
    reviewsList: [{ id: "ztp1", author: "Jean P.", rating: 5, date: "3 days ago", comment: "Very reassuring to have friendly tourist police officers right at the entrance.", avatar: "JP", verified: true }]
  },
  {
    id: "cimas-medical-center",
    name: "CIMAS Emergency Medical Centre & Lab",
    category: "Emergency & Health",
    subCategory: "Urgent Care & Clinic",
    location: "Robert Mugabe Way, Masvingo",
    distanceKm: 4.1,
    lat: -20.0720,
    lng: 30.8310,
    rating: 4.8,
    reviews: 92,
    seed: "cimasmedical",
    imageUrl: img("cimasmedical", 800, 500),
    desc: "24-hour private emergency clinic, pathology laboratory, digital X-ray, and ambulance dispatch for international travel insurance.",
    entryPrice: "24/7 ER (+263 39 226 1800)",
    tags: ["Private ER", "Ambulance", "CIMAS Lab", "Travel Insurance Accepted"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Ramped ER entrance", lastVerified: "1 day ago" },
    reviewsList: [{ id: "cmc1", author: "Samantha W.", rating: 5, date: "2 days ago", comment: "Top tier private facility, accepted international medical travel insurance easily.", avatar: "SW", verified: true }]
  },
  {
    id: "rujeko-city-clinic",
    name: "Rujeko Community Health & Maternity Clinic",
    category: "Emergency & Health",
    subCategory: "Public Clinic",
    location: "Rujeko Suburb, Masvingo",
    distanceKm: 5.5,
    lat: -20.0890,
    lng: 30.8420,
    rating: 4.4,
    reviews: 50,
    seed: "rujekoclinic",
    imageUrl: img("rujekoclinic", 800, 500),
    desc: "Municipal public health center offering primary care, outpatient services, and emergency nursing care.",
    entryPrice: "Public Health Clinic (+263 39 226 3100)",
    tags: ["Public Clinic", "Maternity", "Nursing Care", "Primary Health"],
    accessibility: { mobility: "good", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Level courtyard", lastVerified: "3 days ago" },
    reviewsList: [{ id: "rcc1", author: "Nurse Chipo", rating: 4, date: "4 days ago", comment: "Friendly community clinic staff.", avatar: "NC", verified: true }]
  },
  {
    id: "psmi-masvingo-pharmacy",
    name: "PSMI 24-Hour Emergency Pharmacy & Clinic",
    category: "Emergency & Health",
    subCategory: "Pharmacy & Urgent Care",
    location: "Josiah Tongogara St, Masvingo",
    distanceKm: 4.0,
    lat: -20.0735,
    lng: 30.8330,
    rating: 4.7,
    reviews: 105,
    seed: "psmipharmacy",
    imageUrl: img("psmipharmacy", 800, 500),
    desc: "Full-service 24/7 pharmacy stocking prescription medicine, travel vaccines, first aid kits, and doctor consultations.",
    entryPrice: "24/7 Open Pharmacy (+263 39 226 5000)",
    tags: ["24-Hour Pharmacy", "Vaccines", "First Aid", "Prescriptions"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Automatic glass doors", lastVerified: "1 day ago" },
    reviewsList: [{ id: "pmp1", author: "David K.", rating: 5, date: "1 day ago", comment: "Filled my prescription at 11 PM without any issues.", avatar: "DK", verified: true }]
  },
  {
    id: "makurira-memorial-hospital",
    name: "Makurira Memorial Private Hospital",
    category: "Emergency & Health",
    subCategory: "Private Hospital",
    location: "Masvingo West",
    distanceKm: 4.9,
    lat: -20.0650,
    lng: 30.8210,
    rating: 4.8,
    reviews: 74,
    seed: "makurirahospital",
    imageUrl: img("makurirahospital", 800, 500),
    desc: "Renowned private surgical and general hospital featuring modern operating theaters, ICU beds, and specialist doctors.",
    entryPrice: "Private Hospital Admissions (+263 39 226 2900)",
    tags: ["Private Hospital", "ICU", "Surgeons", "Specialists"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Elevator & ramped casualty", lastVerified: "2 days ago" },
    reviewsList: [{ id: "mmh1", author: "Dr. Makurira", rating: 5, date: "3 days ago", comment: "State of the art surgical suites and private patient rooms.", avatar: "DM", verified: true }]
  },
  {
    id: "mars-ambulance-masvingo",
    name: "MARS Medical Air Rescue & 24/7 Ambulance",
    category: "Emergency & Health",
    subCategory: "Ambulance & Air Rescue",
    location: "Masvingo Regional Base",
    distanceKm: 3.8,
    lat: -20.0700,
    lng: 30.8350,
    rating: 4.9,
    reviews: 88,
    seed: "marsambulance",
    imageUrl: img("marsambulance", 800, 500),
    desc: "Medical Air Rescue Service providing mobile ICU ambulances, paramedic dispatch, and helicopter air evacuation.",
    entryPrice: "Emergency Toll-Free Hotline: 994",
    tags: ["MARS Ambulance", "Air Evac", "Paramedics", "Toll-Free 994"],
    accessibility: { mobility: "full", visual: true, hearing: true, sensory: true, facilities: true, parking: true, terrain: "Mobile ICU ambulance fleet", lastVerified: "1 day ago" },
    reviewsList: [{ id: "mam1", author: "Captain Vance", rating: 5, date: "1 day ago", comment: "Rapid air rescue and paramedic dispatch across Masvingo province.", avatar: "CV", verified: true }]
  },
  {
    id: "gonarezhou-gate",
    name: "Gonarezhou National Park (North Gate)",
    category: "Places",
    subCategory: "National Park",
    location: "Chiredzi / Masvingo South",
    distanceKm: 60,
    lat: -21.0500,
    lng: 31.6000,
    rating: 4.9,
    reviews: 142,
    seed: "gonarezhou",
    imageUrl: img("gonarezhou", 800, 500),
    desc: "Land of the Elephants — famous Chilojo Cliffs and untouched wilderness.",
    entryPrice: "USD 12",
    tags: ["National Park", "Elephants", "Cliffs"],
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
    lat: -20.0597,
    lng: 30.8328,
    rating: 4.4,
    reviews: 62,
    seed: "weaving",
    imageUrl: img("weaving", 800, 500),
    desc: "Cooperative market selling soapstone carvings, woven baskets, and traditional Shona art.",
    entryPrice: "Free",
    tags: ["Market", "Crafts", "Artisans"],
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

/* ── Unified API Getters ── */

export function apiGetAllPlaces(): PlaceDetail[] {
  return MASTER_DATASET
}

export function apiGetPopularPlaces(limit = 4): PlaceDetail[] {
  return MASTER_DATASET.slice(0, limit)
}

export function apiGetPlacesByRange(
  rangeKm: 30 | 60,
  category = "All",
  activeProfiles: AccessProfile[] = [],
): PlaceDetail[] {
  let list = MASTER_DATASET.filter((p) => p.distanceKm <= rangeKm)

  if (category !== "All") {
    if (category === "Places") list = list.filter((p) => p.category === "Places")
    else if (category === "Experiences" || category === "Things to Do") list = list.filter((p) => p.category === "Things to Do" || p.category === "Experiences")
    else if (category === "Stay") list = list.filter((p) => p.category === "Stay" || p.subCategory.includes("Lodge") || p.subCategory.includes("Hotel") || p.subCategory.includes("Resort"))
    else if (category === "Get Around") list = list.filter((p) => p.category === "Get Around" || p.subCategory.includes("Car") || p.subCategory.includes("Shuttle"))
    else if (category === "Services") list = list.filter((p) => p.category === "Services")
    else if (category === "Food & Drink") list = list.filter((p) => p.subCategory.includes("Dining") || p.subCategory.includes("Food") || p.tags.includes("Dining") || p.tags.includes("Nando's"))
    else if (category === "Emergency & Health") list = list.filter((p) => p.category === "Emergency & Health" || p.subCategory.includes("Hospital") || p.subCategory.includes("Police") || p.subCategory.includes("Clinic") || p.subCategory.includes("Emergency"))
  }

  if (activeProfiles.length > 0) {
    list = list.filter((p) => {
      return activeProfiles.every((prof) => {
        if (prof === "mobility") return p.accessibility.mobility !== "none"
        if (prof === "visual") return p.accessibility.visual
        if (prof === "hearing") return p.accessibility.hearing
        if (prof === "sensory") return p.accessibility.sensory
        return true
      })
    })
  }

  return list
}

export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371 // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

export function apiGetPlacesWithCalculatedDistances(
  userLat = -20.2674,
  userLng = 30.9338,
): PlaceDetail[] {
  return MASTER_DATASET.map((p) => ({
    ...p,
    distanceKm: calculateHaversineDistance(userLat, userLng, p.lat, p.lng),
  }))
}

export function apiGetPlaceById(id: string): PlaceDetail {
  return MASTER_DATASET.find((p) => p.id === id) || MASTER_DATASET[0]
}

export function apiGetPlaceReviews(id: string): ReviewItem[] {
  const p = apiGetPlaceById(id)
  return p ? p.reviewsList : []
}

export function apiGetConnectedNearby(
  currentId: string,
  categoryFilter: string,
  limit = 6,
): PlaceDetail[] {
  const cat = categoryFilter.toLowerCase()
  return MASTER_DATASET.filter((p) => {
    if (p.id === currentId) return false
    if (categoryFilter === "Places") return p.category === "Places"
    if (categoryFilter === "Experiences") return p.category === "Experiences"
    if (categoryFilter === "Services") return p.category === "Services"
    return (
      p.category.toLowerCase().includes(cat) ||
      p.subCategory.toLowerCase().includes(cat) ||
      p.tags.some((t) => t.toLowerCase().includes(cat))
    )
  }).slice(0, limit)
}

export function apiGetPracticalInfo(place: PlaceDetail) {
  const infoMap: Record<string, { hours: string; bestTime: string; dress: string; bring: string; contact: string }> = {
    "great-zimbabwe": {
      hours: "08:00 – 17:30",
      bestTime: "April – October",
      dress: "Comfortable shoes",
      bring: "Water, hat, camera",
      contact: "+263 39 226 0561",
    },
    "lake-mutirikwi": {
      hours: "06:00 – 18:00",
      bestTime: "All year",
      dress: "Casual outdoor wear",
      bring: "Sunscreen, binoculars",
      contact: "+263 39 263 1002",
    },
    "cultural-exp": {
      hours: "09:00 – 16:00",
      bestTime: "All year",
      dress: "Casual, respectful attire",
      bring: "Camera, open mind",
      contact: "+263 77 445 8820",
    },
    "mushandike": {
      hours: "06:00 – 18:00",
      bestTime: "May – September",
      dress: "Safari wear, neutral colours",
      bring: "Binoculars, water, insect repellent",
      contact: "+263 39 262 4410",
    },
    "dining-heritage": {
      hours: "07:00 – 21:00",
      bestTime: "All year",
      dress: "Casual",
      bring: "Appetite",
      contact: "+263 39 226 0400",
    },
    "kyle-park": {
      hours: "06:00 – 18:00",
      bestTime: "April – October",
      dress: "Comfortable outdoor wear",
      bring: "Picnic supplies, camera",
      contact: "+263 39 264 1180",
    },
  }

  const fallback = {
    hours: "08:00 – 17:00",
    bestTime: "April – October",
    dress: "Comfortable shoes",
    bring: "Water, hat, camera",
    contact: "+263 39 226 0000",
  }

  return infoMap[place.id] || fallback
}

export function apiGetMinistryTelemetry(totalBookings: number, totalViews: number) {
  const baseVisitors = 24821
  const total = baseVisitors + totalBookings + totalViews

  return {
    totalVisitors: total,
    avgStayNights: 3.4,
    localRatio: 62,
    intlRatio: 38,
    activityTrend: +(8.2 + totalBookings * 0.3).toFixed(1),
    regionalNodes: [
      { name: "Masvingo", count: 4280 + totalBookings, share: "34%" },
      { name: "Victoria Falls", count: 12450, share: "42%" },
      { name: "Hwange", count: 6200, share: "15%" },
      { name: "Gonarezhou", count: 1890, share: "9%" },
    ],
  }
}

export function apiGetIndigenousStories(placeId?: string): IndigenousStory[] {
  if (!placeId) return INDIGENOUS_CULTURAL_STORIES
  return INDIGENOUS_CULTURAL_STORIES.filter((story) => story.placeId === placeId)
}

export function apiGetGreatZimbabweNarrative(): IndigenousStory | undefined {
  return (
    INDIGENOUS_CULTURAL_STORIES.find((story) => story.placeId === "great-zimbabwe") ||
    INDIGENOUS_CULTURAL_STORIES[0]
  )
}

export type NewListingInput = {
  name: string
  category: "Places" | "Stay" | "Things to Do" | "Get Around" | "Services" | "Experiences" | "Food & Drink" | "Emergency & Health"
  subCategory: string
  location: string
  entryPrice: string
  desc: string
  imageUrl?: string
  tags?: string[]
  mobilityAccess?: "full" | "good" | "partial" | "none"
}

export function apiAddNewListing(input: NewListingInput): PlaceDetail {
  const id = `listing-${Date.now()}`
  const newPlace: PlaceDetail = {
    id,
    name: input.name,
    category: input.category,
    subCategory: input.subCategory || "Tourism Provider Service",
    location: input.location || "Masvingo",
    distanceKm: +(Math.random() * 4 + 0.5).toFixed(1),
    lat: -20.2674 + (Math.random() * 0.04 - 0.02),
    lng: 30.9338 + (Math.random() * 0.04 - 0.02),
    rating: 5.0,
    reviews: 1,
    seed: "lodgeancientcity",
    imageUrl:
      input.imageUrl ||
      img("lodgeancientcity", 800, 500),
    desc: input.desc || "Verified Tourism Service listed via ZimTour Provider Portal.",
    entryPrice: input.entryPrice || "USD 50",
    tags: input.tags && input.tags.length > 0 ? input.tags : ["Verified Provider", "ZTA Certified"],
    accessibility: {
      mobility: input.mobilityAccess || "good",
      visual: true,
      hearing: true,
      sensory: true,
      facilities: true,
      parking: true,
      terrain: "Paved entrance & standard access",
      lastVerified: "Just now",
    },
    reviewsList: [
      {
        id: `rev-${Date.now()}`,
        author: "ZimTour Quality Assurance",
        rating: 5,
        date: "Just now",
        comment: "Newly verified & certified service listing added to the official ZimTour platform.",
        avatar: "ZT",
        verified: true,
      },
    ],
  }

  MASTER_DATASET.unshift(newPlace)
  return newPlace
}

/**
 * Initial stored platform bookings with localStorage backing
 */
export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: "bk-1001",
    placeId: "gz-hotel",
    placeName: "Great Zimbabwe Hotel",
    category: "Stay",
    touristName: "Sarah Jenkins",
    touristEmail: "s.jenkins@example.com",
    touristPhone: "+263 77 123 4567",
    bookingDate: "2026-09-05",
    guests: 2,
    servicePriceUSD: 140,
    platformCommissionUSD: 4.20, // 3%
    providerPayoutUSD: 135.80,  // 97%
    totalAmountUSD: 140,
    paymentMethod: "Visa/Mastercard",
    status: "Confirmed",
    confirmationCode: "ZT-884921",
    createdAt: "2 days ago",
  },
  {
    id: "bk-1002",
    placeId: "great-zimbabwe-monument",
    placeName: "Great Zimbabwe Monument Tour",
    category: "Places",
    touristName: "Tendai Moyo",
    touristEmail: "tendai.moyo@example.co.zw",
    touristPhone: "+263 71 987 6543",
    bookingDate: "2026-09-02",
    guests: 4,
    servicePriceUSD: 60,
    platformCommissionUSD: 1.80, // 3%
    providerPayoutUSD: 58.20,   // 97%
    totalAmountUSD: 60,
    paymentMethod: "EcoCash",
    status: "Completed",
    confirmationCode: "ZT-771044",
    createdAt: "4 days ago",
  },
  {
    id: "bk-1003",
    placeId: "cleaver-lake-resort",
    placeName: "Cleaver Lake Mutirikwi Resort",
    category: "Stay",
    touristName: "David Kuenburg",
    touristEmail: "dk@example.de",
    touristPhone: "+49 151 234567",
    bookingDate: "2026-09-10",
    guests: 2,
    servicePriceUSD: 210,
    platformCommissionUSD: 6.30, // 3%
    providerPayoutUSD: 203.70,  // 97%
    totalAmountUSD: 210,
    paymentMethod: "Inntel Pay",
    status: "Confirmed",
    confirmationCode: "ZT-339182",
    createdAt: "Yesterday",
  },
]

export let MASTER_BOOKINGS: BookingRecord[] = INITIAL_BOOKINGS

// Helper to load persisted bookings on client
function loadPersistedBookings(): BookingRecord[] {
  if (typeof window === "undefined") return INITIAL_BOOKINGS
  try {
    const raw = localStorage.getItem("zimtour_bookings_v1")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {}
  return INITIAL_BOOKINGS
}

function saveBookings(bookings: BookingRecord[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("zimtour_bookings_v1", JSON.stringify(bookings))
  } catch {}
}

// Initialize on client load if browser
if (typeof window !== "undefined") {
  MASTER_BOOKINGS = loadPersistedBookings()
}

/**
 * Create a new booking with automatic 3% platform commission retention
 */
export function apiCreateBooking(input: {
  placeId: string
  touristName: string
  touristEmail: string
  touristPhone: string
  bookingDate: string
  guests: number
  unitPriceUSD: number
  paymentMethod: "EcoCash" | "Inntel Pay" | "Visa/Mastercard" | "ZimSwitch"
}): BookingRecord {
  const place = MASTER_DATASET.find((p) => p.id === input.placeId) || MASTER_DATASET[0]
  const total = Math.max(1, input.unitPriceUSD * input.guests)
  const commission = Math.round(total * PLATFORM_COMMISSION_RATE * 100) / 100
  const payout = Math.round((total - commission) * 100) / 100

  const randCode = `ZT-${Math.floor(100000 + Math.random() * 900000)}`

  const record: BookingRecord = {
    id: `bk-${Date.now()}`,
    placeId: place.id,
    placeName: place.name,
    category: place.category,
    touristName: input.touristName || "Verified Tourist",
    touristEmail: input.touristEmail || "tourist@zimtour.co.zw",
    touristPhone: input.touristPhone || "+263 77 000 0000",
    bookingDate: input.bookingDate || new Date().toISOString().split("T")[0],
    guests: input.guests || 1,
    servicePriceUSD: total,
    platformCommissionUSD: commission,
    providerPayoutUSD: payout,
    totalAmountUSD: total,
    paymentMethod: input.paymentMethod || "EcoCash",
    status: "Confirmed",
    confirmationCode: randCode,
    createdAt: "Just now",
  }

  MASTER_BOOKINGS.unshift(record)
  saveBookings(MASTER_BOOKINGS)

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("zimtour_booking_created", { detail: record }))
  }

  return record
}

export function apiGetAllBookings(): BookingRecord[] {
  if (typeof window !== "undefined") {
    MASTER_BOOKINGS = loadPersistedBookings()
  }
  return MASTER_BOOKINGS
}

export function apiGetPlatformFinancials() {
  const grossVolumeUSD = MASTER_BOOKINGS.reduce((sum, b) => sum + b.servicePriceUSD, 0)
  const platformCommissionsUSD = MASTER_BOOKINGS.reduce((sum, b) => sum + b.platformCommissionUSD, 0)
  const providerPayoutsUSD = MASTER_BOOKINGS.reduce((sum, b) => sum + b.providerPayoutUSD, 0)

  return {
    grossVolumeUSD: Math.round(grossVolumeUSD * 100) / 100,
    platformCommissionsUSD: Math.round(platformCommissionsUSD * 100) / 100,
    providerPayoutsUSD: Math.round(providerPayoutsUSD * 100) / 100,
    totalBookingsCount: MASTER_BOOKINGS.length,
    commissionRatePercent: 3,
  }
}

/**
 * Submit a tourist review for a specific destination/service
 */
export function apiAddReview(input: {
  placeId: string
  author: string
  rating: number
  comment: string
}): ReviewItem {
  const place = MASTER_DATASET.find((p) => p.id === input.placeId) || MASTER_DATASET[0]

  const initials = input.author
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "TV"

  const newReview: ReviewItem = {
    id: `rev-${Date.now()}`,
    author: input.author || "Verified Tourist",
    rating: Math.min(5, Math.max(1, input.rating)),
    date: "Just now",
    comment: input.comment,
    avatar: initials,
    verified: true,
  }

  place.reviewsList.unshift(newReview)
  place.reviews += 1

  // Recalculate average rating
  const totalRating = place.reviewsList.reduce((sum, r) => sum + r.rating, 0)
  place.rating = +(totalRating / place.reviewsList.length).toFixed(1)

  return newReview
}
