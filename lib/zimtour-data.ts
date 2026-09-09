const IMAGE_MAP: Record<string, string> = {
  // ── Authentic Local Zimbabwe Attractions ──
  "greatzim-hero": "/zim/great-zimbabwe.png",
  "greatzimruins": "/zim/great-zimbabwe.png",
  "gzruins2": "/zim/greatz.jpg.jpeg",
  "gzruins3": "/zim/greatz2.jpg.jpeg",
  "vicfalls": "/zim/victoria-falls.png",
  "lakemutirikwi": "/zim/lake-mutirikwi.png",
  "lakemutirikwi2": "/zim/mutirikwe.jpg.jpeg",
  "lakemutirikwi3": "/zim/mutirikwe2.jpg.jpeg",
  "lakemutirikwi4": "/zim/mutirikwe3.jpg.jpeg",
  "gonarezhou": "/zim/gonarezhou.jpg.jpeg",
  "gonarezhou2": "/zim/gonarezhou2.jpg.jpeg",
  "gonarezhou3": "/zim/gonarezhou3.jpg.jpeg",
  "singita": "/zim/singita.jpeg",
  "singita2": "/zim/singita2.jpg.jpeg",
  "malilangwe": "/zim/malilangwe.jpg.jpeg",
  "malilangwe2": "/zim/malilangwe2.jpg.jpeg",
  "malilangwe3": "/zim/malilangwe3.jpg.jpeg",
  "nyuni": "/zim/nyuni2.jpg.jpeg",
  "nyuni2": "/zim/nyuni2.jpg.jpeg",
  "nyunipotrait": "/zim/nyunipotrait.jpg.jpeg",
  "pakoteke": "/zim/pakoteke_gorge.jpg.jpeg",
  "pakoteke2": "/zim/pakoteke_gorge2.jpg.jpeg",
  "zrp-masvingo": "/zim/zrp_masvingo.jpeg",
  "zrp-tourism": "/zim/zrp_tourism.jpg.jpeg",
  "tugwimukosi": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "tugwiruins": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "culturalexp": "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80",
  "culturalexp2": "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80",
  "mushandike": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
  "localfood": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  "kylepark": "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80",
  "hotsprings": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  "mountain": "/zim/nyunipotrait.jpg.jpeg",
  "birdsanctuary": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=80",
  "basketry": "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
  "weaving": "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
  "ngomakurira": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "sikatolion": "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=800&q=80",
  "chamavaracaves": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "chivicaves": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "chivizacave": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "rockart": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",

  // ── Distinct Curated Visuals for Accommodations ──
  "lodgeancientcity": "/zim/greatz.jpg.jpeg",
  "singitapamushana": "/zim/singita.jpeg",
  "nyunilodge": "/zim/nyuni2.jpg.jpeg",
  "cleversresort": "/zim/lake-mutirikwi.png",
  "flamboyant": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
  "normajeanes": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80",
  "greatzimhotel": "/zim/great-zimbabwe.png",
  "chevronhotel": "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=600&q=80",
  "simbalodge": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
  "kylechalets": "/zim/mutirikwe3.jpg.jpeg",
  "tentedcamp": "/zim/gonarezhou2.jpg.jpeg",
  "urbanbreeze": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
  "bushmanrock": "/zim/malilangwe.jpg.jpeg",
  "gorgelodge": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",

  // ── Things to Do (Tours & Activities) ──
  "boatcruise": "/zim/mutirikwe.jpg.jpeg",
  "archaeo": "/zim/greatz2.jpg.jpeg",
  "gamedrive": "/zim/gonarezhou.jpg.jpeg",
  "pokotekewalk": "/zim/pakoteke_gorge.jpg.jpeg",
  "drumming": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
  "photoexp": "/zim/greatz2.jpg.jpeg",
  "damwalk": "/zim/mutirikwe3.jpg.jpeg",
  "walkingsafari": "/zim/malilangwe2.jpg.jpeg",
  "thermalbath": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  "mountaintrek": "/zim/nyunipotrait.jpg.jpeg",
  "kayaking": "/zim/mutirikwe2.jpg.jpeg",
  "carving": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",

  // ── Get Around (Car Hire & Travel) ──
  "carhire": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
  "impalacar": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
  "shuttlebus": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
  "coach": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80",
  "towncab": "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=600&q=80",
  "citycab": "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=600&q=80",
  "avisrental": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
  "jettyshuttle": "/zim/mutirikwe.jpg.jpeg",
  "camper4x4": "/zim/gonarezhou2.jpg.jpeg",
  "hoponshuttle": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",

  // ── Services (Dining & Shopping) ──
  "craftmarket": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
  "chevrondining": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
  "exorstation": "https://images.unsplash.com/photo-1527018606416-a65453770388?auto=format&fit=crop&w=600&q=80",
  "nandos": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
  "supermarket": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
  "leathercraft": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=600&q=80",
  "coffeebistro": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
  "totalenergies": "https://images.unsplash.com/photo-1527018606416-a65453770388?auto=format&fit=crop&w=600&q=80",

  // ── Emergency & Health (Hospitals, Police, Clinics, Rescue) ──
  "provincialhospital": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
  "policehq": "/zim/zrp_masvingo.jpeg",
  "morningsideclinic": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
  "firebrigade": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
  "touristpolice": "/zim/zrp_tourism.jpg.jpeg",
  "cimasmedical": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
  "rujekoclinic": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
  "psmipharmacy": "https://images.unsplash.com/photo-1586015555751-63c07e0c4b26?auto=format&fit=crop&w=600&q=80",
  "makurirahospital": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
  "marsambulance": "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80",
}

export const img = (seed: string, w = 400, h = 300) =>
  IMAGE_MAP[seed] || "/zim/hero.png"

export type Place = {
  id: string
  name: string
  location: string
  distance: string
  rating: number
  reviews: number
  tags: string[]
  seed: string
}

export const popularPlaces: Place[] = [
  {
    id: "victoria-falls",
    name: "Victoria Falls",
    location: "Livingstone",
    distance: "48 km",
    rating: 4.8,
    reviews: 230,
    tags: ["Adventure", "Nature"],
    seed: "vicfalls",
  },
  {
    id: "great-zimbabwe",
    name: "Great Zimbabwe",
    location: "Masvingo",
    distance: "32 km",
    rating: 4.6,
    reviews: 180,
    tags: ["History", "Culture"],
    seed: "greatzimruins",
  },
  {
    id: "lake-mutirikwi",
    name: "Lake Mutirikwi",
    location: "Masvingo",
    distance: "27 km",
    rating: 4.5,
    reviews: 98,
    tags: ["Nature", "Relaxation"],
    seed: "lakemutirikwi",
  },
  {
    id: "ngoma-kurira",
    name: "Ngoma Kurira",
    location: "Masvingo",
    distance: "18 km",
    rating: 4.4,
    reviews: 72,
    tags: ["Culture", "Heritage"],
    seed: "ngomakurira",
  },
]

export type Experience = {
  id: string
  name: string
  desc: string
  distance: string
  duration?: string
  group?: string
  rating: number
  reviews: number
  category: string
  seed: string
  topPick?: boolean
}

export const nearbyExperiences: Experience[] = [
  {
    id: "gz-ruins",
    name: "Great Zimbabwe Ruins",
    desc: "Explore the iconic UNESCO World Heritage site and ancient stone structures.",
    distance: "0.8 km",
    duration: "2–3 hrs",
    group: "Guided tours",
    rating: 4.8,
    reviews: 120,
    category: "Heritage",
    seed: "gzruins2",
    topPick: true,
  },
  {
    id: "cultural",
    name: "Local Cultural Experience",
    desc: "Engage with local communities, learn traditions and enjoy cultural storytelling.",
    distance: "8 km",
    duration: "2–4 hrs",
    group: "Small groups",
    rating: 4.7,
    reviews: 86,
    category: "Culture",
    seed: "culturalexp",
  },
  {
    id: "lake",
    name: "Lake Mutirikwi",
    desc: "Scenic lake views, picnic spots, boating and bird watching.",
    distance: "25 km",
    duration: "Half day",
    group: "Family friendly",
    rating: 4.6,
    reviews: 72,
    category: "Nature",
    seed: "lakemutirikwi2",
  },
  {
    id: "tugwi",
    name: "Tugwi–Mukosi",
    desc: "Ancient city ruins with rich history and breathtaking views.",
    distance: "32 km",
    duration: "2–3 hrs",
    group: "Guided tours",
    rating: 4.5,
    reviews: 65,
    category: "Heritage",
    seed: "tugwimukosi",
  },
]

export const moreExperiences: Experience[] = [
  { id: "kyle", name: "Kyle Recreational Park", desc: "", distance: "18 km", rating: 4.4, reviews: 45, category: "Recreation", seed: "kylepark" },
  { id: "sikato", name: "Sikato Lion Park", desc: "", distance: "28 km", rating: 4.3, reviews: 38, category: "Wildlife", seed: "sikatolion" },
  { id: "chamavara", name: "Chamavara Caves", desc: "", distance: "36 km", rating: 4.5, reviews: 27, category: "Nature", seed: "chamavaracaves" },
  { id: "chivi", name: "Chivi Caves", desc: "", distance: "40 km", rating: 4.2, reviews: 31, category: "Adventure", seed: "chivicaves" },
]

export type AccessLevel = "full" | "good" | "partial"

export type AccessibleExperience = {
  id: string
  name: string
  access: AccessLevel
  distance?: string
  tags: string[]
  category: string
  status: string
  seed: string
}

export const accessibleNearby: AccessibleExperience[] = [
  { id: "gz", name: "Great Zimbabwe", access: "partial", distance: "0.8 km", tags: ["Partial Access", "Parking"], category: "Heritage Site", status: "Open", seed: "gzruins2" },
  { id: "lake", name: "Lake Mutirikwi", access: "good", distance: "25 km", tags: ["Good Access", "Facilities"], category: "Nature", status: "Open", seed: "lakemutirikwi2" },
  { id: "cultural", name: "Cultural Experience", access: "full", distance: "4 km", tags: ["Full Access", "Guide Available"], category: "Culture", status: "Bookable", seed: "culturalexp" },
  { id: "tokwe", name: "Tokwe–Mukosi", access: "partial", distance: "18 km", tags: ["Partial Access", "Hiking"], category: "Heritage", status: "Open", seed: "tugwimukosi" },
]

export const accessibleRecommended = [
  { id: "weaving", name: "Traditional Weaving", access: "partial" as AccessLevel, duration: "2–3 hrs", group: "Small groups", price: "$20 / person", seed: "weaving" },
  { id: "rockart", name: "Rock Art Trail", access: "good" as AccessLevel, duration: "Half day", group: "Guided", price: "$25 / person", seed: "rockart" },
  { id: "food", name: "Local Food Experience", access: "good" as AccessLevel, duration: "2 hrs", group: "All ages", price: "$18 / person", seed: "localfood" },
  { id: "chiviza", name: "Chiviza Caves", access: "partial" as AccessLevel, duration: "2–3 hrs", group: "Moderate", price: "$15 / person", seed: "chivizacave" },
]

export const localServices = [
  { name: "Local Dining", desc: "Zimbabwean cuisine", distance: "1.2 km", icon: "utensils" },
  { name: "Fuel Station", desc: "Open 24 hours", distance: "2.1 km", icon: "fuel" },
  { name: "Car Hire", desc: "Local & trusted partners", distance: "3.4 km", icon: "car" },
  { name: "Pharmacy", desc: "Health & essentials", distance: "2.6 km", icon: "pill" },
]

export const bookings = [
  {
    id: "gz-tour",
    name: "Great Zimbabwe — Guided Tour",
    detail: "Tomorrow · 09:00 AM · 2 guests",
    status: "confirmed" as const,
    price: "USD 50",
    seed: "gzruins3",
    action: "View details",
  },
  {
    id: "lake-boat",
    name: "Lake Mutirikwi — Boat Trip",
    detail: "Sat, 6 Sep · 07:30 AM · 4 guests",
    status: "pending" as const,
    price: "USD 80",
    seed: "lakemutirikwi4",
    action: "Complete payment",
  },
]

export const popularQuestions = [
  "What can I do in Masvingo in one day?",
  "Best places to visit near Great Zimbabwe?",
  "Tell me about Shona culture and traditions.",
  "Is Lake Mutirikwi good for a day trip?",
  "Where can I try authentic local food?",
]

export const chatRecommendations = [
  { name: "Local Cultural Experience", distance: "8 km", desc: "Engage with local communities, learn traditions and enjoy cultural storytelling.", tag: "Available today", seed: "culturalexp2" },
  { name: "Lake Mutirikwi", distance: "25 km", desc: "Scenic lake views, picnic spots, boating and bird watching.", tag: "Good weather", seed: "lakemutirikwi3" },
  { name: "Tugwi–Mukosi Ruins", distance: "28 km", desc: "Ancient city ruins with rich history and breathtaking views.", tag: "Available today", seed: "tugwiruins" },
]

export const adminStats = [
  { label: "Visitors", value: "24,821", sub: "Total visitors this period", icon: "users", tint: "brand" },
  { label: "Avg. Stay", value: "3.4", unit: "nights", sub: "Average length of stay", icon: "clock", tint: "blue" },
  { label: "Local / International", value: "62% / 38%", sub: "Visitor composition", icon: "userCog", tint: "violet" },
  { label: "Tourism Activity", value: "↑ 8.2%", sub: "vs previous period", icon: "trendingUp", tint: "brand", up: true },
]

export const adminInsights = [
  { kind: "Opportunity", text: "Masvingo visitors are increasingly exploring cultural experiences beyond Great Zimbabwe.", icon: "lightbulb", tint: "brand" },
  { kind: "Trend", text: "Average visitor stay increased 18% this period.", icon: "trendingUp", tint: "blue" },
  { kind: "Gap", text: "34% of tourism experiences have incomplete accessibility information.", icon: "alertTriangle", tint: "amber" },
]

export const mapPins = [
  { name: "Victoria Falls", top: "22%", left: "38%" },
  { name: "Hwange", top: "34%", left: "22%" },
  { name: "Masvingo", top: "52%", left: "56%" },
  { name: "Nyanga", top: "48%", left: "82%" },
  { name: "Matobo", top: "60%", left: "32%" },
  { name: "Gonarezhou", top: "80%", left: "70%" },
]
