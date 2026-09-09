"use client"

import { useState } from "react"
import {
  MapPin,
  Clock,
  Users,
  Star,
  Heart,
  LayoutGrid,
  UtensilsCrossed,
  BedDouble,
  Car,
  ShoppingBag,
  Accessibility,
  Footprints,
  Sparkles,
  Eye,
  Ear,
  Brain,
  CheckCircle2,
  Navigation,
  MessageSquare,
  ShieldAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useZimTourStore,
  setRangeKm,
  toggleAccessibilityProfile,
  setSelectedPlaceId,
  type AccessProfile,
} from "@/lib/zimtour-store"
import { apiGetPlacesByRange } from "@/lib/zimtour-api"
import type { View } from "./types"

const CATEGORY_FILTERS = [
  { icon: LayoutGrid, label: "All" },
  { icon: MapPin, label: "Places" },
  { icon: Users, label: "Experiences" },
  { icon: BedDouble, label: "Stay" },
  { icon: UtensilsCrossed, label: "Food & Drink" },
  { icon: Car, label: "Get Around" },
  { icon: ShoppingBag, label: "Services" },
  { icon: ShieldAlert, label: "Emergency & Health" },
]

const ACCESSIBILITY_PROFILES: { id: AccessProfile; label: string; icon: typeof Accessibility }[] = [
  { id: "mobility", label: "Mobility", icon: Accessibility },
  { id: "visual", label: "Visual", icon: Eye },
  { id: "hearing", label: "Hearing", icon: Ear },
  { id: "sensory", label: "Sensory / Cognitive", icon: Brain },
]

export function ExploreView({
  onNavigate,
  onOpenListing,
  onOpenLocationMap,
}: {
  onNavigate: (v: View) => void
  onOpenListing: () => void
  onOpenLocationMap?: () => void
}) {
  const store = useZimTourStore()
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Query Local API for filtered places based on range (30km / 60km), category, and active accessibility profiles
  const finalPlaces = apiGetPlacesByRange(
    store.selectedRangeKm,
    selectedCategory,
    store.activeAccessibilityProfiles,
  )

  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId)
    onOpenListing()
  }

  return (
    <div className="space-y-4">
      {/* ── Range Toggle & Accessibility Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
        {/* Left: Range Selector & Full Map Button */}
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-extrabold text-foreground">Discovery Range:</span>
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setRangeKm(30)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-extrabold transition cursor-pointer",
                store.selectedRangeKm === 30
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-300" />
              Within 30 km
            </button>
            <button
              onClick={() => setRangeKm(60)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-extrabold transition cursor-pointer",
                store.selectedRangeKm === 60
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Navigation className="h-3.5 w-3.5 text-emerald-300" />
              Extended 60 km
            </button>
          </div>

          {onOpenLocationMap && (
            <button
              onClick={onOpenLocationMap}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-extrabold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition shadow-2xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Full Radar Map
            </button>
          )}
        </div>

        {/* Right: Accessibility Multi-select Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Accessibility className="h-3.5 w-3.5 text-emerald-500" />
            Accessibility:
          </span>
          {ACCESSIBILITY_PROFILES.map((prof) => {
            const isActive = store.activeAccessibilityProfiles.includes(prof.id)
            const Icon = prof.icon
            return (
              <button
                key={prof.id}
                onClick={() => toggleAccessibilityProfile(prof.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold transition cursor-pointer",
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 shadow-2xs"
                    : "border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                {prof.label}
                {isActive && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Category Filters & Counter Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => {
            const Icon = cat.icon
            const isSel = selectedCategory === cat.label
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition cursor-pointer",
                  isSel
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        <span className="text-[12px] font-bold text-muted-foreground">
          Showing <span className="text-emerald-500 font-extrabold">{finalPlaces.length}</span> destinations from Local API
        </span>
      </div>

      {/* ── Main Grid of Filtered Places (Connected to Local API) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {finalPlaces.map((place) => (
          <div
            key={place.id}
            onClick={() => handleSelectPlace(place.id)}
            className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition hover:border-emerald-500 hover:shadow-xs"
          >
            <div
              className="relative h-[160px] w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${place.imageUrl}')` }}
            >
              <span className="absolute left-2 top-2 rounded-md bg-emerald-900/90 px-2 py-0.5 text-[10.5px] font-bold text-white shadow-xs backdrop-blur-xs">
                {place.subCategory || place.category}
              </span>
              <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                {place.distanceKm} km
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-bold text-foreground group-hover:text-emerald-500 leading-tight">
                  {place.name}
                </h3>
                <div className="flex items-center gap-1 text-[12px] font-extrabold text-[#e0a30b] shrink-0">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{place.rating}</span>
                  <span className="text-[10.5px] text-muted-foreground font-semibold">({place.reviews})</span>
                </div>
              </div>

              <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                {place.desc}
              </p>

              {/* Accessibility Profile Pill Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-300 capitalize">
                  {place.accessibility.mobility} access
                </span>
                {place.accessibility.visual && (
                  <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-300">
                    Visual Guide
                  </span>
                )}
                {place.accessibility.facilities && (
                  <span className="rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10.5px] font-semibold text-sky-600 dark:text-sky-300">
                    Facilities
                  </span>
                )}
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between border-t border-border/50 text-[11.5px]">
                <span className="font-semibold text-muted-foreground">
                  Entry: <b className="text-foreground">{place.entryPrice || "USD 10"}</b>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                  View Details →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
