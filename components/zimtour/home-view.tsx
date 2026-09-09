"use client"

import { useState, useMemo } from "react"
import {
  Sparkles,
  MapPin,
  Users,
  Landmark,
  CalendarDays,
  BedDouble,
  Car,
  ShoppingBag,
  Heart,
  Star,
  ArrowUpRight,
  Bot,
  Sun,
  MessageSquare,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Tag,
} from "lucide-react"
import { MASTER_DATASET, apiGetPopularPlaces, type PlaceDetail } from "@/lib/zimtour-api"
import { setSelectedPlaceId } from "@/lib/zimtour-store"
import type { View } from "./types"

type CategoryItem = {
  key: string
  icon: any
  title: string
  desc: string
  subCategoryFilter?: string
}

const FEATURES: CategoryItem[] = [
  { key: "Places", icon: MapPin, title: "Explore Places", desc: "Attractions & gems nearby" },
  { key: "Stay", icon: BedDouble, title: "Stay", desc: "Hotels & lodges" },
  { key: "Things to Do", icon: CalendarDays, title: "Things to Do", desc: "Tours & activities" },
  { key: "Get Around", icon: Car, title: "Get Around", desc: "Car hire & travel info" },
  { key: "Services", icon: ShoppingBag, title: "Services", desc: "Dining & shopping" },
  { key: "Emergency & Health", icon: ShieldAlert, title: "Emergency & Health", desc: "Hospitals, police & clinics" },
]

export function HomeView({
  onNavigate,
  onOpenListing,
}: {
  onNavigate: (v: View) => void
  onOpenListing: () => void
}) {
  const [activeCategoryModal, setActiveCategoryModal] = useState<CategoryItem | null>(null)
  const popularPlaces = apiGetPopularPlaces(4)

  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId)
    onOpenListing()
  }

  // Filter listings from MASTER_DATASET for active category modal
  const modalListings: PlaceDetail[] = useMemo(() => {
    if (!activeCategoryModal) return []
    const key = activeCategoryModal.key

    return MASTER_DATASET.filter((item) => {
      if (key === "Places") return item.category === "Places"
      if (key === "Stay") return item.category === "Stay" || item.subCategory.includes("Lodge") || item.subCategory.includes("Hotel") || item.subCategory.includes("Resort")
      if (key === "Things to Do") return item.category === "Things to Do" || item.category === "Experiences" || item.subCategory.includes("Tour") || item.subCategory.includes("Activity")
      if (key === "Get Around") return item.category === "Get Around" || item.subCategory.includes("Car") || item.subCategory.includes("Shuttle") || item.subCategory.includes("Rental")
      if (key === "Services") return item.category === "Services"
      if (key === "Emergency & Health") return item.category === "Emergency & Health" || item.subCategory.includes("Hospital") || item.subCategory.includes("Police") || item.subCategory.includes("Clinic") || item.subCategory.includes("Emergency")
      return true
    })
  }, [activeCategoryModal])

  return (
    <div className="space-y-4 relative">
      {/* ── Compact Hero Banner ── */}
      <section
        className="relative flex h-[190px] items-center overflow-hidden rounded-2xl bg-cover bg-center px-6 py-4 text-white shadow-xs"
        style={{ backgroundImage: `url('/zim/hero.png')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-950/75 to-transparent" />
        <div className="relative max-w-[560px]">
          <h2 className="mb-1 text-[22px] font-extrabold leading-tight tracking-tight sm:text-[26px]">
            Discover Zimbabwe with Intelligence
          </h2>
          <p className="mb-3 max-w-[420px] text-[12.5px] leading-snug text-white/90">
            AI-powered travel insights & real-time discovery near you.
          </p>

          <div className="flex items-center gap-2 rounded-xl bg-card/95 p-1 shadow-md border border-border/40">
            <Sparkles className="ml-2 h-4 w-4 shrink-0 text-brand-600" />
            <input
              className="flex-1 bg-transparent px-2 py-1 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
              placeholder='Ask ZimTour AI… e.g. "Hotels near Great Zimbabwe?"'
            />
            <button
              onClick={() => onNavigate("ai")}
              className="rounded-lg bg-brand-900 px-4 py-1.5 text-[12px] font-bold text-white transition hover:bg-brand-800"
            >
              Ask
            </button>
          </div>
        </div>
      </section>

      {/* ── Interactive 5-Column Feature Row ── */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <button
              key={f.title}
              onClick={() => setActiveCategoryModal(f)}
              className="group flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left shadow-2xs transition hover:border-brand-600 hover:shadow-xs"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold group-hover:bg-brand-900 group-hover:text-white transition">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[12.5px] font-bold text-foreground truncate group-hover:text-brand-700">
                  {f.title}
                </h3>
                <p className="text-[10.5px] text-muted-foreground truncate">{f.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Popular Near You (Connected directly to Local API) ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold text-foreground">Popular near you</h3>
          <button
            onClick={() => onNavigate("explore")}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 transition hover:text-brand-800"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popularPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => handleSelectPlace(place.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-2xs transition hover:border-brand-600 hover:shadow-xs"
            >
              <div
                className="relative h-[95px] w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${place.imageUrl}')` }}
              >
                <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {place.distanceKm} km
                </span>
              </div>
              <div className="flex flex-1 flex-col p-2.5">
                <h4 className="text-[13px] font-bold text-foreground group-hover:text-brand-700 truncate">
                  {place.name}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground my-0.5">
                  <MapPin className="h-3 w-3 text-brand-600 shrink-0" />
                  <span className="truncate">{place.location}</span>
                </div>
                <div className="mt-auto flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-0.5 font-bold text-[#e0a30b]">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{place.rating}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">({place.reviews})</span>
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {place.subCategory || place.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Promo Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card border border-border px-4 py-2.5 text-[12px] text-foreground shadow-2xs">
          <span className="font-medium text-foreground">
            Are you a local operator? Join our verified tourism intelligence graph.
          </span>
          <button
            onClick={() => onNavigate("settings")}
            className="rounded-lg bg-brand-900 px-3 py-1 text-[11.5px] font-bold text-white hover:bg-brand-800 transition cursor-pointer"
          >
            List Your Business →
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── CLEAN CATEGORY DETAIL MODAL WINDOW ── */}
      {/* ========================================================================= */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
          <div className="flex flex-col max-h-[88vh] w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white shadow-xs">
                  {(() => {
                    const Icon = activeCategoryModal.icon
                    return <Icon className="h-5 w-5" />
                  })()}
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-foreground flex items-center gap-2">
                    {activeCategoryModal.title}
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 border border-emerald-500/30">
                      {modalListings.length} verified listings
                    </span>
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    {activeCategoryModal.desc} in Masvingo & Zimbabwe (Local API Data)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCategoryModal(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Listings Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {modalListings.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {modalListings.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-2xs hover:border-brand-600 transition"
                    >
                      <div>
                        {/* Thumbnail & Distance badge */}
                        <div
                          className="relative h-[120px] w-full rounded-lg bg-cover bg-center overflow-hidden mb-3 border border-border"
                          style={{ backgroundImage: `url('${item.imageUrl}')` }}
                        >
                          <span className="absolute top-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[10.5px] font-bold text-white backdrop-blur-xs">
                            {item.distanceKm} km away
                          </span>
                          <span className="absolute bottom-2 left-2 rounded-md bg-brand-900/90 px-2 py-0.5 text-[10.5px] font-extrabold text-white">
                            {item.entryPrice}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase text-brand-700 tracking-wider">
                              {item.subCategory}
                            </span>
                            <div className="flex items-center gap-1 text-[11.5px] font-bold text-[#e0a30b]">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{item.rating}</span>
                              <span className="text-[10px] text-muted-foreground">({item.reviews})</span>
                            </div>
                          </div>

                          <h4 className="text-[14px] font-extrabold text-foreground group-hover:text-brand-700 leading-snug">
                            {item.name}
                          </h4>

                          <p className="text-[11.5px] text-muted-foreground line-clamp-2">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 border-t border-border/60 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 text-brand-600 shrink-0" />
                          <span>{item.location}</span>
                        </div>

                        <button
                          onClick={() => {
                            handleSelectPlace(item.id)
                            setActiveCategoryModal(null)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-brand-800 shadow-2xs"
                        >
                          View Details
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No listings found in this category.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/20">
              <span className="text-[11.5px] text-muted-foreground">
                All data retrieved live from Local API (`MASTER_DATASET`)
              </span>

              <button
                onClick={() => {
                  setActiveCategoryModal(null)
                  onNavigate("explore")
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:text-brand-800 transition"
              >
                Explore All Listings →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
