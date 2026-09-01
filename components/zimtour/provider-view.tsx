import { useState, useEffect } from "react"
import {
  Building2,
  Plus,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  Edit,
  Eye,
  ShieldCheck,
  UploadCloud,
  FileText,
  AlertCircle,
  Lock,
  Sparkles,
  Check,
  X,
  BedDouble,
  Car,
  UtensilsCrossed,
  ShieldAlert,
  ChevronRight,
  Info,
  Mic,
  Video,
  BookOpen,
  Volume2,
  Globe,
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  MASTER_DATASET,
  INDIGENOUS_CULTURAL_STORIES,
  addIndigenousStory,
  apiAddNewListing,
  type IndigenousStory,
  type PlaceDetail,
} from "@/lib/zimtour-api"
import { useZimTourStore, setProviderVerified } from "@/lib/zimtour-store"
import type { View } from "./types"

type ProviderCategory = "stay" | "tours" | "transport" | "services" | "health"

type RequiredDoc = {
  id: string
  name: string
  authority: string
  mandatory: boolean
}

const REQUIRED_DOCS_BY_CATEGORY: Record<ProviderCategory, { label: string; docs: RequiredDoc[] }> = {
  stay: {
    label: "Stay & Accommodation (Hotels, Lodges & Guest Houses)",
    docs: [
      { id: "zta_license", name: "ZTA Tourism Operating License", authority: "Zimbabwe Tourism Authority", mandatory: true },
      { id: "health_cert", name: "Health & Hygiene Inspection Certificate", authority: "Ministry of Health & Child Care", mandatory: true },
      { id: "tax_clearance", name: "Tax Clearance Certificate (ITF263)", authority: "ZIMRA", mandatory: true },
    ],
  },
  tours: {
    label: "Things to Do (Tours, Safaris & Activities)",
    docs: [
      { id: "tour_operator", name: "ZTA Tour Operator Registration", authority: "Zimbabwe Tourism Authority", mandatory: true },
      { id: "guide_license", name: "Professional Guide & Tracker License", authority: "ZimParks / ZTA", mandatory: true },
      { id: "liability_insurance", name: "Passenger & Visitor Liability Insurance", authority: "Registered Insurer", mandatory: true },
    ],
  },
  transport: {
    label: "Get Around (Car Hire, Chauffeurs & Shuttles)",
    docs: [
      { id: "vts_license", name: "Passenger Transport License (VTS)", authority: "Ministry of Transport", mandatory: true },
      { id: "vid_cert", name: "VID Vehicle Certificate of Fitness", authority: "Vehicle Inspection Dept", mandatory: true },
      { id: "transport_insurance", name: "Comprehensive Commercial Insurance", authority: "Registered Insurer", mandatory: true },
    ],
  },
  services: {
    label: "Services (Dining, Shopping & Tourism Outlets)",
    docs: [
      { id: "food_permit", name: "Municipal Council Food & Health Permit", authority: "Local City Council", mandatory: true },
      { id: "liquor_license", name: "Liquor Licensing Board Permit", authority: "Liquor Licensing Board", mandatory: false },
      { id: "zta_facility", name: "ZTA Tourism Facility License", authority: "Zimbabwe Tourism Authority", mandatory: true },
    ],
  },
  health: {
    label: "Emergency & Health Services (Hospitals & Clinics)",
    docs: [
      { id: "mdpcz_reg", name: "Medical Council Registration (MDPCZ)", authority: "MDPCZ", mandatory: true },
      { id: "pharmacy_license", name: "Health Institution Operating Permit", authority: "HPA Zimbabwe", mandatory: true },
      { id: "ambulance_permit", name: "Emergency Vehicle License", authority: "Ministry of Health", mandatory: true },
    ],
  },
}

export function ProviderView({
  activeSubView,
  onNavigate,
}: {
  activeSubView?: View
  onNavigate: (v: View) => void
}) {
  const store = useZimTourStore()
  const isVerified = store.providerVerified

  const [activeTab, setActiveTab] = useState<"dashboard" | "listings" | "bookings" | "verification">("dashboard")
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>("stay")
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  // ── Listing Creation State ──
  const [myListings, setMyListings] = useState<PlaceDetail[]>(MASTER_DATASET.slice(0, 5))
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState<
    "Places" | "Stay" | "Things to Do" | "Get Around" | "Services" | "Experiences" | "Food & Drink" | "Emergency & Health"
  >("Stay")
  const [newSubCategory, setNewSubCategory] = useState("Boutique Eco-Lodge")
  const [newLocation, setNewLocation] = useState("Masvingo")
  const [newPrice, setNewPrice] = useState("USD 85 / night")
  const [newDesc, setNewDesc] = useState("")
  const [newMobility, setNewMobility] = useState<"full" | "good" | "partial" | "none">("good")
  const [newImagePreset, setNewImagePreset] = useState("/zim/singita.jpeg")

  function handleAddListingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle || !newPrice) return

    const createdPlace = apiAddNewListing({
      name: newTitle,
      category: newCategory,
      subCategory: newSubCategory,
      location: newLocation,
      entryPrice: newPrice,
      desc: newDesc || `${newTitle} — Verified tourism service certified by Zimbabwe Tourism Authority.`,
      imageUrl: newImagePreset,
      mobilityAccess: newMobility,
    })

    setMyListings([createdPlace, ...myListings])
    setShowAddModal(false)
    setNewTitle("")
    setNewDesc("")
    setActiveTab("listings")
  }

  // ── Local Culture & Oral History Upload Modal State ──
  const [showCultureModal, setShowCultureModal] = useState(false)
  const [cultureFormat, setCultureFormat] = useState<"audio" | "video" | "text">("audio")
  const [cultureTitle, setCultureTitle] = useState("")
  const [cultureStoryteller, setCultureStoryteller] = useState("")
  const [cultureLanguage, setCultureLanguage] = useState<"Shona (Karanga)" | "Ndebele" | "English">("Shona (Karanga)")
  const [cultureTranscript, setCultureTranscript] = useState("")
  const [cultureSignificance, setCultureSignificance] = useState("")
  const [cultureAttachedFile, setCultureAttachedFile] = useState<string | null>(null)
  const [storiesFeed, setStoriesFeed] = useState<IndigenousStory[]>(INDIGENOUS_CULTURAL_STORIES)

  function handleCultureSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cultureTitle || !cultureStoryteller || !cultureTranscript) return

    const newStory = addIndigenousStory({
      placeId: "great-zimbabwe",
      placeName: "Great Zimbabwe National Monument",
      title: cultureTitle,
      storyteller: cultureStoryteller,
      format: cultureFormat,
      mediaUrl:
        cultureFormat === "audio"
          ? "https://actions.google.com/sounds/v1/ambiences/outdoor_gentle_breeze.ogg"
          : cultureFormat === "video"
          ? "https://www.w3schools.com/html/mov_bbb.mp4"
          : undefined,
      duration: cultureFormat === "audio" ? "3 min 40 sec" : cultureFormat === "video" ? "5 min 15 sec" : undefined,
      language: cultureLanguage,
      transcript: cultureTranscript,
      culturalSignificance: cultureSignificance || "Preserving living heritage & local oral traditions.",
      unescoAlignment: "Fulfills UNESCO Living Heritage Guidelines by documenting local oral history.",
    })

    setStoriesFeed([newStory, ...storiesFeed])
    setShowCultureModal(false)
    setCultureTitle("")
    setCultureStoryteller("")
    setCultureTranscript("")
    setCultureSignificance("")
    setCultureAttachedFile(null)
  }

  // Sync subView from sidebar navigation
  useEffect(() => {
    if (activeSubView === "provider-listings") {
      setActiveTab("listings")
    } else if (activeSubView === "provider-reservations") {
      setActiveTab("bookings")
    } else if (activeSubView === "provider-verification") {
      setActiveTab("verification")
    } else if (activeSubView === "provider-dashboard" || activeSubView === "provider") {
      setActiveTab("dashboard")
    }
  }, [activeSubView])

  // Filter provider-relevant listings from dataset
  const providerListings = MASTER_DATASET.slice(0, 5)

  function handleDemoUpload(docId: string, docName: string) {
    setUploadedDocs((prev) => ({
      ...prev,
      [docId]: `${docName.replace(/[^a-zA-Z0-9]/g, "_")}_2026.pdf`,
    }))
  }

  function handleVerifySubmit() {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setProviderVerified(true, selectedCategory)
      setActiveTab("dashboard")
    }, 800)
  }

  const categoryDocs = REQUIRED_DOCS_BY_CATEGORY[selectedCategory].docs
  const uploadedCount = categoryDocs.filter((d) => uploadedDocs[d.id]).length
  const allMandatoryUploaded = categoryDocs.filter((d) => d.mandatory).every((d) => uploadedDocs[d.id])

  return (
    <div className="space-y-6">
      {/* ── UNVERIFIED PROVIDER ONBOARDING BANNER ── */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 text-amber-900 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-amber-950">
                  Verification Required to Unlock Listing Features
                </h3>
                <p className="text-[13px] text-amber-900/90 font-medium">
                  Upload your mandatory operating licenses and certificates to verify your tourism business and unlock direct bookings, listing publishing, and telemetry analytics.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("verification")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-900 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-amber-800 transition shrink-0"
            >
              <span>Upload Documents Now</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-amber-200/80 pt-3 text-[12px] font-bold text-amber-900">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              Publishing Locked
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              Direct Bookings Locked
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 underline cursor-pointer" onClick={() => setActiveTab("verification")}>
              Select category required docs →
            </span>
          </div>
        </div>
      )}

      {/* VERIFIED BANNER SUCCESS */}
      {isVerified && (
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-950 via-brand-950 to-brand-900 p-5 text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-brand-950 font-black shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">Verified Tourism Provider Portal</h3>
                <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                  #ZIM-PRV-4920 ({store.verifiedCategory ? store.verifiedCategory.toUpperCase() : "PLACES"})
                </span>
              </div>
              <p className="text-[12.5px] text-white/80 font-medium">
                Verified category: <span className="font-extrabold text-emerald-300 capitalize">{store.verifiedCategory || "places"}</span>. Certified by Zimbabwe Tourism Authority (ZTA).
              </p>
            </div>
          </div>

          {isVerified && (
            <div className="flex items-center gap-2 shrink-0">
              {store.verifiedCategory === "places" && (
                <button
                  onClick={() => setShowCultureModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-amber-950 shadow-md hover:bg-amber-300 transition active:scale-95"
                >
                  <Mic className="h-4 w-4" />
                  Upload Local Culture / Stories
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-brand-950 shadow-md hover:bg-emerald-400 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add New Service
              </button>
            </div>
          )}
        </div>
      )}

      {/* Provider Header Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "rounded-xl px-4 py-2 text-[13px] font-extrabold transition",
            activeTab === "dashboard"
              ? "bg-brand-900 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Overview Dashboard
        </button>

        <button
          onClick={() => setActiveTab("listings")}
          className={cn(
            "rounded-xl px-4 py-2 text-[13px] font-extrabold transition",
            activeTab === "listings"
              ? "bg-brand-900 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          My Listings ({isVerified ? myListings.length : 0})
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={cn(
            "rounded-xl px-4 py-2 text-[13px] font-extrabold transition flex items-center gap-2",
            activeTab === "bookings"
              ? "bg-brand-900 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Reservations
          {isVerified && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-brand-950">
              3
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          className={cn(
            "rounded-xl px-4 py-2 text-[13px] font-extrabold transition flex items-center gap-1.5",
            activeTab === "verification"
              ? "bg-brand-900 text-white shadow-xs"
              : isVerified
              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              : "text-amber-800 bg-amber-100/70 hover:bg-amber-200/70",
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          Verification & Docs
          {isVerified && <Check className="h-3.5 w-3.5 text-emerald-600" />}
        </button>
      </div>

      {/* ── UNVERIFIED USER EMPTY STATE FOR DASHBOARD / LISTINGS / BOOKINGS TABS ── */}
      {!isVerified && activeTab !== "verification" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-10 text-center shadow-2xs space-y-4 my-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-200 text-amber-950 border border-amber-300 shadow-xs">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-black text-amber-950">Get verified to start listing</h3>
            <p className="text-xs font-medium text-amber-900/80 leading-relaxed">
              Upload your mandatory operating licenses and business certificates in the Verification & Docs tab to unlock your provider dashboard, publish listings, and accept tourist reservations.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("verification")}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-950 px-6 py-3 text-xs font-black text-white shadow-md hover:bg-amber-900 transition active:scale-95"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Get Verified Now</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW DASHBOARD ── */}
      {isVerified && activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[12px] font-bold">Active Listings</span>
                <Building2 className="h-4 w-4 text-brand-600" />
              </div>
              <div className="text-2xl font-black text-foreground">5 Services</div>
              <span className="text-[11.5px] text-emerald-600 font-semibold">
                {isVerified ? "✓ Verified & Published" : "⚠️ Verification Pending"}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[12px] font-bold">Monthly Bookings</span>
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-foreground">128 Rides/Stays</div>
              <span className="text-[11.5px] text-emerald-600 font-semibold">↑ 18% from last month</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[12px] font-bold">Estimated Revenue</span>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-foreground">$14,850 USD</div>
              <span className="text-[11.5px] text-muted-foreground">Direct tourist payments</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[12px] font-bold">Average Service Rating</span>
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-black text-foreground">4.8 / 5.0</div>
              <span className="text-[11.5px] text-muted-foreground">Based on 340 verified reviews</span>
            </div>
          </div>

          {/* Quick Actions */}
          {/* Quick Operations */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-base font-extrabold text-foreground">Provider Quick Operations</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => (isVerified ? setShowAddModal(true) : setActiveTab("verification"))}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3.5 text-left transition",
                  isVerified ? "border-border bg-background hover:border-brand-400" : "border-amber-200 bg-amber-50/40 opacity-90",
                )}
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg font-bold", isVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-200 text-amber-900")}>
                  {isVerified ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground">
                    {isVerified ? "Add New Service" : "Unlock Listing Creation"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {isVerified ? "Publish room, tour, or vehicle" : "Verify business licenses first"}
                  </p>
                </div>
              </button>

              {isVerified && store.verifiedCategory === "places" ? (
                <button
                  onClick={() => setShowCultureModal(true)}
                  className="flex items-center gap-3 rounded-xl border border-amber-300/80 bg-amber-50/50 p-3.5 text-left transition hover:border-amber-400"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-200 text-amber-950 font-bold">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-amber-950">Upload Local Culture</h4>
                    <p className="text-[11px] text-amber-800/90 font-medium">Audio, video & elder stories</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab("verification")}
                  className="flex items-center gap-3 rounded-xl border border-muted bg-muted/30 p-3.5 text-left opacity-75 cursor-not-allowed"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-muted-foreground">Oral History Repository</h4>
                    <p className="text-[11px] text-muted-foreground/80 font-medium">Places verification required</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => setActiveTab("verification")}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 text-left transition hover:border-brand-400"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-900 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground">Verification Vault</h4>
                  <p className="text-[11px] text-muted-foreground">Manage ZTA & Health licenses</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 text-left transition hover:border-brand-400"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground">Pending Requests</h4>
                  <p className="text-[11px] text-muted-foreground">3 incoming tourist bookings</p>
                </div>
              </button>
            </div>
          </div>


        </div>
      )}

      {/* ── TAB 2: MY LISTINGS ── */}
      {isVerified && activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground">My Managed Services & Vehicles</h3>
              {!isVerified && (
                <p className="text-xs text-amber-800 font-medium">
                  Verification required to create new listings & accept reservations.
                </p>
              )}
            </div>
            {isVerified ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-900 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-brand-800"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Listing
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("verification")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-amber-700"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Upload Verification Docs
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {myListings.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs hover:border-brand-300 transition"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-24 w-28 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase text-brand-700">
                        {item.subCategory}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-extrabold text-foreground truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11.5px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {item.location} · {item.entryPrice}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Available Today
                    </span>
                    <button className="text-[11.5px] font-extrabold text-brand-900 hover:underline flex items-center gap-1">
                      <Edit className="h-3 w-3" /> Edit Pricing
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: RESERVATIONS ── */}
      {isVerified && activeTab === "bookings" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-extrabold text-foreground">Tourist Reservations Queue</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              3 Pending Requests
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-brand-900">Great Zimbabwe Guided Heritage Tour</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">Confirmed</span>
                </div>
                <p className="text-[12px] text-muted-foreground">Tourist: Sarah Jenkins (UK) · 2 Adults · Today 14:00</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">Contact Tourist</button>
                <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">Accept Request</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-brand-900">Mutirikwi Lake Shore Lodge Stay</span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">Pending Review</span>
                </div>
                <p className="text-[12px] text-muted-foreground">Tourist: Kudzai Mapfumo · 1 Room (2 Nights) · Tomorrow</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">Review Dates</button>
                <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">Confirm Stay</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: VERIFICATION & DOCUMENTS ONBOARDING ── */}
      {activeTab === "verification" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground">
                  Provider Verification & License Vault
                </h3>
                {isVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-xs font-extrabold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Provider
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Select your business category and upload required legal certificates to unlock direct tourist publishing.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-right">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Provider Badge ID</div>
              <div className="text-sm font-black text-emerald-950">#ZIM-PRV-4920</div>
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground block">
              1. Select Provider Business Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(REQUIRED_DOCS_BY_CATEGORY) as ProviderCategory[]).map((catKey) => {
                const catObj = REQUIRED_DOCS_BY_CATEGORY[catKey]
                const isSelected = selectedCategory === catKey

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={cn(
                      "flex items-center justify-between rounded-xl p-3.5 text-left border transition",
                      isSelected
                        ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                        : "bg-background text-foreground border-border hover:bg-muted",
                    )}
                  >
                    <span className="text-xs font-extrabold truncate pr-2">{catObj.label.split("(")[0]}</span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Documents Upload Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground block">
                2. Required Documents for {REQUIRED_DOCS_BY_CATEGORY[selectedCategory].label.split("(")[0]}
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {uploadedCount} of {categoryDocs.length} Attached
              </span>
            </div>

            <div className="space-y-3">
              {categoryDocs.map((doc) => {
                const isUploaded = !!uploadedDocs[doc.id]

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition",
                      isUploaded ? "border-emerald-300 bg-emerald-50/50" : "border-border bg-background",
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FileText className={cn("h-4 w-4", isUploaded ? "text-emerald-700" : "text-muted-foreground")} />
                        <h4 className="text-xs font-extrabold text-foreground">{doc.name}</h4>
                        {doc.mandatory && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-muted-foreground">Issuing Authority: {doc.authority}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUploaded ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-md">
                            {uploadedDocs[doc.id]}
                          </span>
                          <button
                            onClick={() => {
                              const copy = { ...uploadedDocs }
                              delete copy[doc.id]
                              setUploadedDocs(copy)
                            }}
                            className="p-1 text-muted-foreground hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDemoUpload(doc.id, doc.name)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-900 hover:bg-brand-100 transition"
                        >
                          <UploadCloud className="h-3.5 w-3.5 text-brand-700" />
                          Choose Demo File
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submission Action */}
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Info className="h-4 w-4 text-brand-700 shrink-0" />
              <span>Documents are verified in real-time against ZTA & Ministry registry APIs.</span>
            </div>

            <button
              type="button"
              disabled={!allMandatoryUploaded || isSubmitting}
              onClick={handleVerifySubmit}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black shadow-md transition active:scale-95",
                allMandatoryUploaded
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {isSubmitting ? (
                <span>Verifying Package...</span>
              ) : isVerified ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Update Verified Documents</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-white" />
                  <span>Submit Package & Unlock Verified Access</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── CREATE & PUBLISH TOURISM SERVICE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-2xl space-y-5 border border-emerald-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-foreground">
                    Create & Publish Tourism Service
                  </h3>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-900">
                    Live API Feed
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Publish accommodation, safari tours, transport or dining directly to ZimTour Intelligence.
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddListingSubmit} className="space-y-4">
              {/* Service Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Listing / Service Title</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Great Zimbabwe Heritage Eco-Lodge & Safaris"
                  className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                />
              </div>

              {/* Category & SubCategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Main Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any
                      setNewCategory(cat)
                      const defaultSubs: Record<string, string> = {
                        "Stay": "Boutique Eco-Lodge",
                        "Things to Do": "Guided Heritage Tour",
                        "Get Around": "4x4 Chauffeur & Safari Vehicle",
                        "Places": "Heritage Site & Monument",
                        "Services": "Traditional Dining & Cafe",
                        "Emergency & Health": "Medical Clinic & ER",
                      }
                      setNewSubCategory(defaultSubs[cat] || "Tourism Service")
                    }}
                    className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground font-medium"
                  >
                    {[
                      { value: "Stay", label: "Stay (Hotels & Lodges)", catId: "stay" },
                      { value: "Things to Do", label: "Things to Do (Tours & Activities)", catId: "tours" },
                      { value: "Get Around", label: "Get Around (Car Hire & Travel)", catId: "transport" },
                      { value: "Places", label: "Places & Heritage Sites", catId: "places" },
                      { value: "Services", label: "Services (Dining & Shopping)", catId: "dining" },
                      { value: "Emergency & Health", label: "Emergency & Health", catId: "health" },
                    ].map((catOption) => {
                      const isVerifiedForThis = store.verifiedCategory === catOption.catId
                      return (
                        <option
                          key={catOption.value}
                          value={catOption.value}
                          disabled={!isVerifiedForThis}
                          className={!isVerifiedForThis ? "text-muted-foreground/60 bg-muted/40" : "font-bold text-foreground"}
                        >
                          {catOption.label} {!isVerifiedForThis ? "🔒 (Disabled - Verification Required)" : "✓ (Verified Category)"}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Sub-Service Type / Tag</label>
                  <div className="space-y-1.5">
                    <select
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground font-medium"
                    >
                      {newCategory === "Stay" && (
                        <>
                          <option value="Boutique Eco-Lodge">Boutique Eco-Lodge</option>
                          <option value="Luxury Hotel & Resort">Luxury Hotel & Resort</option>
                          <option value="Safari Tented Camp">Safari Tented Camp</option>
                          <option value="Heritage Guesthouse">Heritage Guesthouse</option>
                          <option value="Self-Catering Chalet">Self-Catering Chalet</option>
                        </>
                      )}
                      {newCategory === "Things to Do" && (
                        <>
                          <option value="Guided Heritage Tour">Guided Heritage Tour</option>
                          <option value="Wildlife & Safari Drive">Wildlife & Safari Drive</option>
                          <option value="Boat Cruise & Water Activities">Boat Cruise & Water Activities</option>
                          <option value="Helicopter & Scenic Flight">Helicopter & Scenic Flight</option>
                          <option value="Cultural & Village Experience">Cultural & Village Experience</option>
                        </>
                      )}
                      {newCategory === "Get Around" && (
                        <>
                          <option value="4x4 Chauffeur & Safari Vehicle">4x4 Chauffeur & Safari Vehicle</option>
                          <option value="Executive Airport Shuttle">Executive Airport Shuttle</option>
                          <option value="Car Rental (Self-Drive)">Car Rental (Self-Drive)</option>
                          <option value="Inter-City Coach">Inter-City Coach</option>
                        </>
                      )}
                      {newCategory === "Services" && (
                        <>
                          <option value="Traditional Dining & Cafe">Traditional Dining & Cafe</option>
                          <option value="Fine Dining Restaurant">Fine Dining Restaurant</option>
                          <option value="Craft Market & Curio Shop">Craft Market & Curio Shop</option>
                          <option value="Fuel & Convenience Station">Fuel & Convenience Station</option>
                        </>
                      )}
                      {newCategory === "Places" && (
                        <>
                          <option value="Heritage Site & Monument">Heritage Site & Monument</option>
                          <option value="National Park & Game Reserve">National Park & Game Reserve</option>
                          <option value="Natural Wonder & Waterfalls">Natural Wonder & Waterfalls</option>
                        </>
                      )}
                      {newCategory === "Emergency & Health" && (
                        <>
                          <option value="Medical Clinic & ER">Medical Clinic & ER</option>
                          <option value="Police Station & Security">Police Station & Security</option>
                          <option value="Tourist Helpline Hub">Tourist Helpline Hub</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Location / Destination</label>
                  <input
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Masvingo / Victoria Falls / Harare"
                    className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Pricing Structure</label>
                  <input
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. USD 85 / night or USD 25 / tour"
                    className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Image Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Select Photo / Cover Preset</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Luxury Lodge", url: "/zim/singita.jpeg" },
                    { label: "Safari Jeep", url: "/zim/gonarezhou.jpg.jpeg" },
                    { label: "Cultural Tour", url: "/zim/great-zimbabwe.png" },
                    { label: "Lake & Nature", url: "/zim/lake-mutirikwi.png" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewImagePreset(preset.url)}
                      className={cn(
                        "relative h-14 overflow-hidden rounded-xl border-2 transition",
                        newImagePreset === preset.url ? "border-emerald-500 shadow-md scale-95" : "border-transparent opacity-75 hover:opacity-100",
                      )}
                    >
                      <img src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-bold py-0.5 text-center">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Service Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe your rooms, tours, amenities, meal options, guided historical walks..."
                  className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                />
              </div>

              {/* Accessibility Rating */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Mobility & Universal Access</label>
                <select
                  value={newMobility}
                  onChange={(e) => setNewMobility(e.target.value as any)}
                  className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground font-medium"
                >
                  <option value="good">Good (Ramps & step-free access available)</option>
                  <option value="full">Full Universal Access (Wheelchair accessible throughout)</option>
                  <option value="partial">Partial Access (Some stairs / stone terrain)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Publish Live to API Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPLOAD LOCAL CULTURE & ORAL NARRATIVES MODAL (UNESCO ALIGNED) ── */}
      {showCultureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-2xl space-y-5 border border-amber-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-foreground">
                    Upload Local Culture & Oral History
                  </h3>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-900">
                    UNESCO Aligned
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Preserve living heritage, elder audio notes, and indigenous narratives from around Great Zimbabwe.
                </p>
              </div>
              <button
                onClick={() => setShowCultureModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCultureSubmit} className="space-y-4">
              {/* Media Format Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-muted-foreground">
                  1. Story Format Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCultureFormat("audio")}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-3 border text-center transition",
                      cultureFormat === "audio"
                        ? "bg-amber-100 border-amber-400 text-amber-950 font-extrabold"
                        : "bg-background border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Mic className="h-5 w-5 text-amber-700" />
                    <span className="text-xs">Audio Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCultureFormat("video")}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-3 border text-center transition",
                      cultureFormat === "video"
                        ? "bg-amber-100 border-amber-400 text-amber-950 font-extrabold"
                        : "bg-background border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Video className="h-5 w-5 text-amber-700" />
                    <span className="text-xs">Video Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCultureFormat("text")}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-3 border text-center transition",
                      cultureFormat === "text"
                        ? "bg-amber-100 border-amber-400 text-amber-950 font-extrabold"
                        : "bg-background border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <FileText className="h-5 w-5 text-amber-700" />
                    <span className="text-xs">Text Narrative</span>
                  </button>
                </div>
              </div>

              {/* Title & Storyteller */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Story / Narrative Title</label>
                  <input
                    required
                    value={cultureTitle}
                    onChange={(e) => setCultureTitle(e.target.value)}
                    placeholder="e.g. The Sacred Conical Tower Rain Rituals"
                    className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Local Storyteller / Elder Name</label>
                  <input
                    required
                    value={cultureStoryteller}
                    onChange={(e) => setCultureStoryteller(e.target.value)}
                    placeholder="e.g. Sekuru Mubaiwa Haruzivishe (Clan Elder)"
                    className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Language / Dialect</label>
                <select
                  value={cultureLanguage}
                  onChange={(e) => setCultureLanguage(e.target.value as any)}
                  className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground font-medium"
                >
                  <option value="Shona (Karanga)">Shona (Karanga Dialect)</option>
                  <option value="Ndebele">Ndebele</option>
                  <option value="English">English Translation</option>
                </select>
              </div>

              {/* Media File Attachment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Media Attachment ({cultureFormat === "audio" ? "Audio MP3" : cultureFormat === "video" ? "Video MP4" : "Document"})
                </label>
                <div className="flex items-center justify-between rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-3">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-amber-700" />
                    <span className="text-xs font-medium text-amber-950">
                      {cultureAttachedFile || `No ${cultureFormat} file attached yet`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCultureAttachedFile(
                        `${cultureFormat}_elder_narrative_greatzim_${Date.now().toString().slice(-4)}.${
                          cultureFormat === "audio" ? "mp3" : cultureFormat === "video" ? "mp4" : "txt"
                        }`,
                      )
                    }
                    className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-800"
                  >
                    {cultureAttachedFile ? "Change Demo File" : "Choose / Record Demo File"}
                  </button>
                </div>
              </div>

              {/* Transcript / Story Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Oral History Transcript / Narrative Text</label>
                <textarea
                  required
                  rows={3}
                  value={cultureTranscript}
                  onChange={(e) => setCultureTranscript(e.target.value)}
                  placeholder="Record or transcribe the traditional lore, rainmaking rituals, spirit mediums (Svikiro), or historical clan events passed down..."
                  className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                />
              </div>

              {/* Cultural Significance & UNESCO Alignment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Cultural Significance & Context</label>
                <input
                  value={cultureSignificance}
                  onChange={(e) => setCultureSignificance(e.target.value)}
                  placeholder="e.g. Restores sacred Shona cosmology and living heritage suppressed during colonial management."
                  className="w-full rounded-xl border border-input p-2.5 text-xs bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCultureModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-extrabold text-white shadow-md hover:bg-amber-500 flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Publish Living Heritage Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
