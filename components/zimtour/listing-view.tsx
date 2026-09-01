"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Share2,
  Heart,
  Accessibility,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  Phone,
  Navigation,
  CheckCircle2,
  Eye,
  Ear,
  Brain,
  Building2,
  Footprints,
  Car,
  MessageSquare,
  X,
  Users,
  Ticket,
  ChevronRight,
  ExternalLink,
  Shirt,
  Backpack,
  Sun,
  UtensilsCrossed,
  BedDouble,
  Fuel,
  ShoppingBag,
  Compass,
  Leaf,
} from "lucide-react"
import {
  useZimTourStore,
  recordUserBooking,
  launchAIWithContext,
  setSelectedPlaceId,
} from "@/lib/zimtour-store"
import {
  apiGetPlaceById,
  apiGetPlaceReviews,
  apiGetConnectedNearby,
  apiGetPracticalInfo,
  apiGetPlacesWithCalculatedDistances,
  apiAddReview,
  apiCreateBooking,
  PLATFORM_COMMISSION_RATE,
  INDIGENOUS_CULTURAL_STORIES,
  type ReviewItem,
  type BookingRecord,
} from "@/lib/zimtour-api"
import { LeafletMap, type MapMarker } from "./leaflet-map"
import type { View } from "./types"

const NEARBY_CHIPS = [
  { id: "Places", label: "Places", icon: MapPin },
  { id: "Experiences", label: "Experiences", icon: Sparkles },
  { id: "Services", label: "Services", icon: Compass },
  { id: "Restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "Accommodation", label: "Accommodation", icon: BedDouble },
  { id: "Car Hire", label: "Car Hire", icon: Car },
  { id: "Fuel Stations", label: "Fuel Stations", icon: Fuel },
  { id: "Shops", label: "Shops", icon: ShoppingBag },
] as const

export function ListingView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const store = useZimTourStore()
  const [isSaved, setIsSaved] = useState(false)
  const [bookingDone, setBookingDone] = useState(false)
  const [nearbyTab, setNearbyTab] = useState<string>("Places")
  const [showReviewsModal, setShowReviewsModal] = useState(false)

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingName, setBookingName] = useState("")
  const [bookingEmail, setBookingEmail] = useState("")
  const [bookingPhone, setBookingPhone] = useState("")
  const [bookingDate, setBookingDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split("T")[0])
  const [bookingGuests, setBookingGuests] = useState(2)
  const [paymentMethod, setPaymentMethod] = useState<"EcoCash" | "Inntel Pay" | "Visa/Mastercard" | "ZimSwitch">("EcoCash")
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null)

  // Review submission state
  const [newReviewAuthor, setNewReviewAuthor] = useState("")
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [newReviewComment, setNewReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("")

  // Fetch from Local API
  const place = apiGetPlaceById(store.selectedPlaceId)
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(() => apiGetPlaceReviews(place.id))
  const nearbyPlaces = apiGetConnectedNearby(place.id, nearbyTab, 4)
  const practical = apiGetPracticalInfo(place)

  // Calculate surrounding map markers around current place
  const surroundingMarkers: MapMarker[] = useMemo(() => {
    const allWithDist = apiGetPlacesWithCalculatedDistances(place.lat, place.lng)
    // Return surrounding items within 50 km radius
    const nearbyItems = allWithDist.filter((p) => p.id !== place.id && p.distanceKm <= 50)
    return [
      {
        id: place.id,
        lat: place.lat,
        lng: place.lng,
        label: place.name,
        subLabel: `${place.subCategory} · Current Place`,
        badge: "⭐ Active",
        imageUrl: place.imageUrl,
        isSelected: true,
        category: place.category,
      },
      ...nearbyItems.map((n) => ({
        id: n.id,
        lat: n.lat,
        lng: n.lng,
        label: n.name,
        subLabel: `${n.subCategory} · ${n.distanceKm} km away`,
        badge: n.entryPrice,
        imageUrl: n.imageUrl,
        isSelected: false,
        category: n.category,
      })),
    ]
  }, [place])

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!newReviewComment.trim()) return

    setIsSubmittingReview(true)
    const review = apiAddReview({
      placeId: place.id,
      author: newReviewAuthor.trim() || "Verified Tourist",
      rating: newReviewRating,
      comment: newReviewComment.trim(),
    })

    setReviewsList((prev) => [review, ...prev])
    setNewReviewComment("")
    setNewReviewAuthor("")
    setNewReviewRating(5)
    setIsSubmittingReview(false)
    setReviewSuccessMsg("Thank you! Your review has been published with Verified Visitor status.")

    setTimeout(() => setReviewSuccessMsg(""), 4000)
  }

  function handleBooking() {
    setShowBookingModal(true)
  }

  // Parse price from entryPrice string (e.g. "USD 70" -> 70, "USD 35/person" -> 35, "$50" -> 50)
  const unitPriceUSD = useMemo(() => {
    const match = place.entryPrice.match(/(\d+(\.\d+)?)/)
    return match ? parseFloat(match[1]) : 50
  }, [place.entryPrice])

  const bookingSubtotal = unitPriceUSD * bookingGuests
  const platformFee = Math.round(bookingSubtotal * PLATFORM_COMMISSION_RATE * 100) / 100
  const providerPayout = Math.round((bookingSubtotal - platformFee) * 100) / 100

  function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmittingBooking(true)

    const record = apiCreateBooking({
      placeId: place.id,
      touristName: bookingName.trim() || "Verified Tourist",
      touristEmail: bookingEmail.trim() || "tourist@zimtour.co.zw",
      touristPhone: bookingPhone.trim() || "+263 77 000 0000",
      bookingDate,
      guests: bookingGuests,
      unitPriceUSD,
      paymentMethod,
    })

    recordUserBooking(place.name)
    setCreatedBooking(record)
    setIsSubmittingBooking(false)
  }

  function handleLaunchAI() {
    launchAIWithContext(place.name)
    onNavigate("ai")
  }

  return (
    <div className="space-y-6 relative">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("explore")}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-foreground transition hover:text-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Explore
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition ${
              isSaved
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-input bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-brand-700 text-brand-700" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-[12.5px] font-semibold text-foreground transition hover:bg-muted">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        {/* =================== LEFT COLUMN =================== */}
        <div className="space-y-6">
          {/* Hero Image */}
          <div className="space-y-2">
            <div
              className="relative h-[320px] sm:h-[360px] w-full rounded-2xl bg-cover bg-center shadow-xs border border-border/60"
              style={{ backgroundImage: `url('${place.imageUrl}')` }}
            >
              <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[11.5px] font-bold text-white backdrop-blur-xs">
                1 / 24
              </span>
            </div>
            {/* Thumbnail strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[place.seed, "gzruins2", "culturalexp", "lakemutirikwi2", "mushandike", "kylepark"].slice(0, 6).map((s, i) => (
                <div
                  key={i}
                  className={`h-[52px] w-[72px] shrink-0 rounded-lg bg-cover bg-center border-2 ${i === 0 ? "border-brand-700" : "border-transparent"} cursor-pointer opacity-${i === 0 ? "100" : "70"} hover:opacity-100 transition`}
                  style={{ backgroundImage: `url('${place.imageUrl.replace(/\/\d+\/\d+/, "/200/130")}')` }}
                />
              ))}
            </div>
          </div>

          {/* Title & Meta */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-extrabold text-foreground tracking-tight">
                {place.name}
              </h1>
              <span className="rounded-md bg-brand-900 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {place.subCategory}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                {place.distanceKm} km from you
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand-600" />
                Open today: {practical.hours}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            {place.desc} Explore the history of the Kingdom of Zimbabwe and experience a remarkable cultural legacy.
          </p>

          {/* Quick Info Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="text-center space-y-0.5">
              <div className="flex justify-center">
                <Ticket className="h-4 w-4 text-brand-700" />
              </div>
              <b className="block text-[13px] font-extrabold text-foreground">{place.entryPrice}</b>
              <span className="text-[10.5px] text-muted-foreground">Adults</span>
            </div>
            <div className="text-center space-y-0.5">
              <div className="flex justify-center">
                <Clock className="h-4 w-4 text-brand-700" />
              </div>
              <b className="block text-[13px] font-extrabold text-foreground">All year</b>
              <span className="text-[10.5px] text-muted-foreground">Dry season ideal</span>
            </div>
            <div className="text-center space-y-0.5">
              <div className="flex justify-center">
                <Users className="h-4 w-4 text-brand-700" />
              </div>
              <b className="block text-[13px] font-extrabold text-foreground">Available</b>
              <span className="text-[10.5px] text-muted-foreground">Local guides</span>
            </div>
            <div className="text-center space-y-0.5">
              <div className="flex justify-center">
                <Heart className="h-4 w-4 text-brand-700" />
              </div>
              <b className="block text-[13px] font-extrabold text-foreground">Yes</b>
              <span className="text-[10.5px] text-muted-foreground">All ages</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleBooking}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13.5px] font-bold text-white transition shadow-xs ${
                bookingDone ? "bg-emerald-600" : "bg-brand-900 hover:bg-brand-800"
              }`}
            >
              {bookingDone ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Reserved!
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" />
                  Book / Reserve
                </>
              )}
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-3 text-[13px] font-semibold text-foreground hover:bg-muted transition">
              <Navigation className="h-4 w-4 text-brand-700" />
              Directions
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-3 text-[13px] font-semibold text-foreground hover:bg-muted transition">
              <Phone className="h-4 w-4 text-brand-700" />
              Call
            </button>
          </div>

          {/* AI Guide Banner */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-brand-50">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <b className="block text-[13.5px] font-bold text-foreground">
                  Understand this place better
                </b>
                <span className="text-[11.5px] text-muted-foreground">
                  Ask our AI Cultural Guide about the history, stories and significance.
                </span>
              </div>
            </div>
            <button
              onClick={handleLaunchAI}
              className="shrink-0 rounded-xl bg-brand-900 px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-brand-800"
            >
              Ask AI Guide
            </button>
          </div>



          {/* ── Explore Nearby ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-extrabold text-foreground">Explore nearby</h3>
              <button
                onClick={() => onNavigate("explore")}
                className="text-[12px] font-bold text-brand-700 hover:underline"
              >
                View all
              </button>
            </div>

            {/* Interactive Category Chips */}
            <div className="flex flex-wrap gap-2 py-1">
              {NEARBY_CHIPS.map((chip) => {
                const Icon = chip.icon
                const isActive = nearbyTab === chip.id
                return (
                  <button
                    key={chip.id}
                    onClick={() => setNearbyTab(chip.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition shadow-2xs border ${
                      isActive
                        ? "bg-brand-900 text-white border-brand-900 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:border-brand-600 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-brand-700"}`} />
                    {chip.label}
                  </button>
                )
              })}
            </div>

            {/* Horizontal Scrollable Cards */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {nearbyPlaces.map((np) => (
                <button
                  key={np.id}
                  onClick={() => setSelectedPlaceId(np.id)}
                  className="group flex-shrink-0 w-[170px] flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-2xs transition hover:border-brand-600"
                >
                  <div
                    className="relative h-[100px] w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${np.imageUrl}')` }}
                  >
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-brand-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {np.distanceKm} km
                    </span>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <b className="block text-[12px] font-bold text-foreground truncate group-hover:text-brand-700">
                      {np.name}
                    </b>
                    <p className="text-[10.5px] text-muted-foreground line-clamp-2 leading-snug">
                      {np.desc}
                    </p>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Star className="h-3 w-3 text-[#e0a30b] fill-current" />
                      <span className="font-bold text-foreground">{np.rating}</span>
                      <span className="text-muted-foreground">({np.reviews})</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>



          {/* ── Travel Responsibly Footer ── */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <Leaf className="h-5 w-5 text-brand-700 shrink-0" />
            <div>
              <b className="text-[13px] font-bold text-foreground">Travel responsibly</b>
              <p className="text-[11.5px] text-muted-foreground">
                Respect local culture, protect heritage sites and keep Zimbabwe beautiful.
              </p>
            </div>
          </div>
        </div>

        {/* =================== RIGHT COLUMN (SIDEBAR) =================== */}
        <div className="space-y-4">
          {/* ── Accessibility Profile Panel ── */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <h3 className="text-[14px] font-extrabold text-foreground">Accessibility</h3>
            <div className="space-y-2.5 text-[12.5px]">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Accessibility className="h-4 w-4 text-brand-700 shrink-0" />
                  Wheelchair (Mobility)
                </span>
                <span className={`font-bold capitalize ${place.accessibility.mobility === "full" ? "text-emerald-700" : place.accessibility.mobility === "none" ? "text-red-600" : "text-amber-600"}`}>
                  {place.accessibility.mobility === "full" ? "Full access" : place.accessibility.mobility === "good" ? "Available" : place.accessibility.mobility === "partial" ? "Partial" : "Not available"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Building2 className="h-4 w-4 text-brand-700 shrink-0" />
                  Accessible facilities
                </span>
                <span className={`font-bold ${place.accessibility.facilities ? "text-emerald-700" : "text-red-600"}`}>
                  {place.accessibility.facilities ? "Available" : "Not available"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Car className="h-4 w-4 text-brand-700 shrink-0" />
                  Accessible parking
                </span>
                <span className={`font-bold ${place.accessibility.parking ? "text-emerald-700" : "text-red-600"}`}>
                  {place.accessibility.parking ? "Available" : "Not available"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Footprints className="h-4 w-4 text-brand-700 shrink-0" />
                  Terrain
                </span>
                <span className="font-bold text-amber-600">
                  {place.accessibility.terrain}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Users className="h-4 w-4 text-brand-700 shrink-0" />
                  Guide assistance
                </span>
                <span className="font-bold text-emerald-700">Available</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Eye className="h-4 w-4 text-brand-700 shrink-0" />
                  Visual assistance
                </span>
                <span className={`font-bold ${place.accessibility.visual ? "text-emerald-700" : "text-red-600"}`}>
                  {place.accessibility.visual ? "Guide available" : "Not available"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Ear className="h-4 w-4 text-brand-700 shrink-0" />
                  Hearing assistance
                </span>
                <span className={`font-bold ${place.accessibility.hearing ? "text-emerald-700" : "text-red-600"}`}>
                  {place.accessibility.hearing ? "Available" : "Not available"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
              <span>Last verified: {place.accessibility.lastVerified}</span>
              <button className="text-brand-700 font-semibold hover:underline flex items-center gap-0.5">
                Report an issue <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ── Book Your Visit Panel ── */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div>
              <h3 className="text-[14px] font-extrabold text-foreground">Book your visit</h3>
              <span className="text-[11.5px] text-muted-foreground">
                Choose how you&apos;d like to experience this place.
              </span>
            </div>
            <button
              onClick={handleBooking}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3 hover:border-brand-600 transition text-left"
            >
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-brand-700" />
                <div>
                  <b className="text-[13px] font-bold text-foreground">Entry Ticket</b>
                  <span className="block text-[11px] text-muted-foreground">Instant confirmation</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <b className="text-[14px] font-extrabold text-foreground">{place.entryPrice}</b>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3 hover:border-brand-600 transition text-left">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-brand-700" />
                <div>
                  <b className="text-[13px] font-bold text-foreground">Guided Tour</b>
                  <span className="block text-[11px] text-muted-foreground">Local guide included</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10.5px] text-muted-foreground mr-0.5">From</span>
                <b className="text-[14px] font-extrabold text-foreground">USD 25</b>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Secure booking. No hidden fees. You&apos;ll pay the provider.
            </div>
          </div>

          {/* ── Location Panel ── */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <h3 className="text-[14px] font-extrabold text-foreground">Location</h3>
            <p className="text-[12px] text-muted-foreground">
              {place.name}, {place.location}, Zimbabwe
            </p>
            {/* Live Leaflet Map showing current place & surrounding points with mobile game pins */}
            <LeafletMap
              markers={surroundingMarkers}
              center={[place.lat, place.lng]}
              zoom={13}
              height="260px"
              onMarkerClick={(id) => setSelectedPlaceId(id)}
            />
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-brand-600" />
              {place.distanceKm} km from your location
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted transition"
            >
              Open in Maps
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          {/* ── Practical Information Panel ── */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <h3 className="text-[14px] font-extrabold text-foreground">Practical information</h3>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-brand-700" />
                  Opening hours
                </span>
                <span className="font-semibold text-foreground">{practical.hours}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Sun className="h-3.5 w-3.5 text-brand-700" />
                  Best time to visit
                </span>
                <span className="font-semibold text-foreground">{practical.bestTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Shirt className="h-3.5 w-3.5 text-brand-700" />
                  Dress code
                </span>
                <span className="font-semibold text-foreground">{practical.dress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Backpack className="h-3.5 w-3.5 text-brand-700" />
                  What to bring
                </span>
                <span className="font-semibold text-foreground">{practical.bring}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-brand-700" />
                  Facilities
                </span>
                <span className="font-semibold text-foreground">
                  {place.accessibility.facilities ? "Restrooms, parking" : "General only"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-brand-700" />
                  Contact
                </span>
                <span className="font-semibold text-foreground">{practical.contact}</span>
              </div>
            </div>
          </div>

          {/* ── Reviews Button ── */}
          <button
            onClick={() => setShowReviewsModal(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs hover:border-brand-600 transition"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-5 w-5 text-brand-700" />
              <div className="text-left">
                <b className="text-[13px] font-bold text-foreground">
                  Verified Reviews ({place.reviews})
                </b>
                <span className="block text-[11px] text-muted-foreground">
                  Read and share visitor experiences
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-[#e0a30b] fill-current" />
              <b className="text-[16px] font-extrabold text-foreground">{place.rating}</b>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      </div>

      {/* ── Reviews Modal ── */}
      {showReviewsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowReviewsModal(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-[18px] font-extrabold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-700" />
                  Reviews for {place.name}
                </h3>
                <span className="text-[11.5px] text-muted-foreground">
                  Sourced from verified local tourist feedback
                </span>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-4 rounded-xl border border-border bg-muted/40 p-4 items-center">
              <div className="text-center sm:border-r sm:border-border sm:pr-4">
                <span className="text-[36px] font-extrabold text-foreground leading-none">
                  {place.rating}
                </span>
                <div className="flex justify-center text-[#e0a30b] my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {place.reviews} total
                </span>
              </div>
              <div className="space-y-1 text-[11.5px]">
                <div className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground">5 star</span>
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full w-[85%] bg-brand-700" />
                  </div>
                  <span className="w-8 text-right font-semibold">85%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground">4 star</span>
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full w-[12%] bg-brand-600" />
                  </div>
                  <span className="w-8 text-right font-semibold">12%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground">3 star</span>
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full w-[3%] bg-amber-500" />
                  </div>
                  <span className="w-8 text-right font-semibold">3%</span>
                </div>
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleSubmitReview} className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 space-y-3">
              <h4 className="text-[13px] font-extrabold text-foreground flex items-center justify-between">
                <span>Write a Tourist Review</span>
                <span className="text-[10.5px] text-brand-700 font-medium">Verified Visitor Badge</span>
              </h4>

              {reviewSuccessMsg && (
                <div className="rounded-lg bg-emerald-100 border border-emerald-300 p-2.5 text-[11.5px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  {reviewSuccessMsg}
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="flex items-center gap-3">
                <span className="text-[11.5px] font-semibold text-muted-foreground">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 transition hover:scale-110"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= newReviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11.5px] font-extrabold text-foreground">
                  {newReviewRating} / 5
                </span>
              </div>

              {/* Author & Comment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name or Alias (e.g. Tendai M.)"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-brand-600"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Share your authentic experience with this service (e.g. accessibility, staff friendliness, value)..."
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card p-2.5 text-[12px] text-foreground outline-none focus:border-brand-600 resize-none"
              />

              <button
                type="submit"
                disabled={isSubmittingReview || !newReviewComment.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-900 px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-brand-800 disabled:opacity-50 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Submit Verified Review
              </button>
            </form>
            <div className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-foreground">
                Community Feedback ({reviewsList.length})
              </h4>
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border border-border bg-card p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-[11px] font-extrabold text-white">
                        {rev.avatar}
                      </span>
                      <div>
                        <b className="block text-[13px] font-bold text-foreground">
                          {rev.author}
                        </b>
                        <span className="text-[10.5px] text-emerald-700 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3" />
                          Verified Visitor · {rev.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex text-[#e0a30b]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOURIST BOOKING ENGINE MODAL ── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-[16px] font-extrabold text-foreground flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-brand-700" />
                  ZimTour Direct Booking Engine
                </h3>
                <p className="text-[11.5px] text-muted-foreground">
                  ZTA-verified booking with instant digital pass issuance
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setCreatedBooking(null)
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdBooking ? (
              /* Success Digital Pass Voucher */
              <div className="space-y-4 text-center py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                    Booking Confirmed & Escrow Secured
                  </span>
                  <h4 className="text-[18px] font-extrabold text-foreground mt-2">
                    {createdBooking.placeName}
                  </h4>
                  <p className="text-[12px] text-muted-foreground">
                    Confirmation Code: <b className="text-brand-900 font-mono">{createdBooking.confirmationCode}</b>
                  </p>
                </div>

                {/* Digital Ticket Card */}
                <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 text-left space-y-2 text-[12px]">
                  <div className="flex justify-between border-b border-brand-200/60 pb-2">
                    <span className="text-muted-foreground">Traveler:</span>
                    <b className="text-foreground">{createdBooking.touristName}</b>
                  </div>
                  <div className="flex justify-between border-b border-brand-200/60 pb-2">
                    <span className="text-muted-foreground">Travel Date:</span>
                    <b className="text-foreground">{createdBooking.bookingDate} ({createdBooking.guests} Guests)</b>
                  </div>
                  <div className="flex justify-between border-b border-brand-200/60 pb-2">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <b className="text-foreground">{createdBooking.paymentMethod}</b>
                  </div>
                  <div className="flex justify-between border-b border-brand-200/60 pb-2">
                    <span className="text-muted-foreground">Total Service Amount:</span>
                    <b className="text-foreground">USD ${createdBooking.servicePriceUSD.toFixed(2)}</b>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">ZimTour System Commission (3% retained):</span>
                    <span className="text-brand-800 font-semibold">USD ${createdBooking.platformCommissionUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Provider Net Payout (97% disbursed):</span>
                    <span className="text-emerald-800 font-semibold">USD ${createdBooking.providerPayoutUSD.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    setCreatedBooking(null)
                  }}
                  className="w-full rounded-xl bg-brand-900 py-3 text-[13px] font-bold text-white transition hover:bg-brand-800 shadow-xs"
                >
                  Close & View My Reserved Tickets
                </button>
              </div>
            ) : (
              /* Booking Input Form */
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                {/* Place summary banner */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 border border-border">
                  <div
                    className="h-12 w-12 rounded-lg bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url('${place.imageUrl}')` }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13.5px] font-extrabold text-foreground truncate">{place.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{place.category} · {place.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[14px] font-extrabold text-brand-900">{place.entryPrice}</span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Tourist Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tendai Moyo"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. tendai@example.co.zw"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Travel / Booking Date *</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Number of Guests *</label>
                    <select
                      value={bookingGuests}
                      onChange={(e) => setBookingGuests(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-600"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-muted-foreground">Select Payment Method *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["EcoCash", "Inntel Pay", "Visa/Mastercard", "ZimSwitch"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-xl border p-2.5 text-center transition ${
                          paymentMethod === method
                            ? "border-brand-600 bg-brand-50 text-brand-900 font-extrabold shadow-2xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted font-medium"
                        }`}
                      >
                        <span className="block text-[11.5px]">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Price Breakdown & 3% Commission Policy */}
                <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 space-y-2 text-[12px]">
                  <h5 className="font-extrabold text-foreground flex items-center justify-between border-b border-brand-200/60 pb-1.5">
                    <span>Payment Summary</span>
                    <span className="text-[10.5px] text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full font-bold">3% System Fee Policy</span>
                  </h5>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({bookingGuests} guests × USD ${unitPriceUSD}):</span>
                    <b className="text-foreground">USD ${bookingSubtotal.toFixed(2)}</b>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-brand-800">ZimTour Platform Fee (3% system retention):</span>
                    <span className="text-brand-900 font-bold">USD ${platformFee.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-800">Net Provider Disbursement (97% payout):</span>
                    <span className="text-emerald-900 font-bold">USD ${providerPayout.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between border-t border-brand-200/60 pt-2 text-[13.5px] font-extrabold text-foreground">
                    <span>Total Amount Charged:</span>
                    <span className="text-brand-900">USD ${bookingSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Explicit Payment & System Terms */}
                <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                  <b className="block text-[11.5px] text-foreground font-extrabold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-700" />
                    ZimTour Booking & Payment Terms Policy
                  </b>
                  <ul className="list-disc list-inside space-y-1">
                    <li><b>3% System Retention Policy:</b> ZimTour Intelligence automatically retains a 3% platform commission to fund AI infrastructure, UNESCO heritage preservation, and ZTA compliance.</li>
                    <li><b>97% Provider Payout:</b> The remaining 97% net amount is guaranteed and disbursed to the verified provider upon voucher scanning.</li>
                    <li><b>Escrow Protection:</b> All payments made through the system are held in audited ZTA escrow until service completion.</li>
                    <li><b>Free 24-Hour Cancellation:</b> Full 100% refund guaranteed if cancelled up to 24 hours prior to travel date.</li>
                  </ul>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full rounded-xl bg-brand-900 py-3 text-[13.5px] font-bold text-white transition hover:bg-brand-800 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  Confirm & Pay USD ${bookingSubtotal.toFixed(2)} via {paymentMethod}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
