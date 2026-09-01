"use client"

import { useState } from "react"
import {
  X,
  MapPin,
  Navigation,
  Compass,
  LayoutGrid,
  Users,
  BedDouble,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useZimTourStore, setRangeKm } from "@/lib/zimtour-store"
import { apiGetPlacesByRange, calculateHaversineDistance } from "@/lib/zimtour-api"
import { LeafletMap, type MapMarker } from "./leaflet-map"

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

export function FullScreenMapModal({
  isOpen,
  onClose,
  onSelectPlace,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectPlace: (id: string) => void
}) {
  const store = useZimTourStore()
  const [selectedCategory, setSelectedCategory] = useState("All")

  if (!isOpen) return null

  // User reference center (Great Zimbabwe / Masvingo)
  const userLat = -20.2674
  const userLng = 30.9338

  // Filter places based on range (30km / 60km) & category
  const rawPlaces = apiGetPlacesByRange(
    store.selectedRangeKm,
    selectedCategory,
    store.activeAccessibilityProfiles,
  )

  const mapMarkers: MapMarker[] = rawPlaces.map((p) => {
    const dist = calculateHaversineDistance(userLat, userLng, p.lat, p.lng)
    return {
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      label: p.name,
      subLabel: `${p.subCategory || p.category} · ${dist} km away`,
      badge: p.entryPrice,
      imageUrl: p.imageUrl,
      description: p.desc,
      rating: p.rating,
      reviews: p.reviews,
      category: p.category,
      isSelected: p.id === store.selectedPlaceId,
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* ── Header Control Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/90 px-6 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-brand-50 shadow-xs">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold text-foreground tracking-tight">
                Location Radar Map
              </h2>
              <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
                {store.selectedRangeKm} km Radius
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-600" />
              Center: Great Zimbabwe National Monument, Masvingo
            </p>
          </div>
        </div>

        {/* Range Toggle Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setRangeKm(30)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-extrabold transition",
                store.selectedRangeKm === 30
                  ? "bg-brand-900 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MapPin className="h-3.5 w-3.5" />
              30 km
            </button>
            <button
              onClick={() => setRangeKm(60)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-extrabold transition",
                store.selectedRangeKm === 60
                  ? "bg-brand-900 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Navigation className="h-3.5 w-3.5" />
              60 km
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Category Filter Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card px-6 py-2">
        <span className="text-[12px] font-extrabold text-foreground shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
          Filter:
        </span>
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon
          const isSel = selectedCategory === cat.label
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold transition",
                isSel
                  ? "bg-brand-900 text-white shadow-2xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/60",
              )}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── Full-Screen Map Canvas ── */}
      <div className="relative flex-1 w-full bg-muted">
        <LeafletMap
          markers={mapMarkers}
          center={[userLat, userLng]}
          zoom={store.selectedRangeKm === 30 ? 12 : 10}
          height="100%"
          previewMode="expanded"
          lockZoomIn={false}
          onMarkerClick={(placeId) => {
            onSelectPlace(placeId)
            onClose()
          }}
        />

        <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 rounded-xl bg-background/90 px-3.5 py-2 text-[12px] font-bold text-foreground border border-border shadow-md backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          Showing <span className="text-brand-700 font-extrabold">{mapMarkers.length}</span> destinations in range. Hover pins for preview cards.
        </div>
      </div>
    </div>
  )
}
