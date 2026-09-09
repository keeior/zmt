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
  Route,
  Clock,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useZimTourStore, setRangeKm, clearPlannedRoute } from "@/lib/zimtour-store"
import { apiGetPlacesByRange, calculateHaversineDistance } from "@/lib/zimtour-api"
import { LeafletMap, type MapMarker, type RouteWaypoint } from "./leaflet-map"

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

  // Convert planned route to polyline waypoints
  const routeWaypoints: RouteWaypoint[] = store.plannedRoute
    ? store.plannedRoute.stops.map((s) => ({
        lat: s.lat,
        lng: s.lng,
        label: s.placeName,
        order: s.order,
      }))
    : []

  const hasRoute = routeWaypoints.length >= 2

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* ── Header Control Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/90 px-6 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs">
            <Compass className="h-4.5 w-4.5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-foreground tracking-tight">
                Location Radar Map
              </h2>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 border border-emerald-500/30">
                {store.selectedRangeKm} km Radius
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-500" />
              Center: Great Zimbabwe, Masvingo
            </p>
          </div>
        </div>

        {/* Range Toggle Buttons + Close */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setRangeKm(30)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-extrabold transition cursor-pointer",
                store.selectedRangeKm === 30
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MapPin className="h-3 w-3" />
              30 km
            </button>
            <button
              onClick={() => setRangeKm(60)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-extrabold transition cursor-pointer",
                store.selectedRangeKm === 60
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Navigation className="h-3 w-3" />
              60 km
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Category Filter Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card px-6 py-1.5">
        <span className="text-[11px] font-extrabold text-foreground shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="h-3 w-3 text-emerald-500" />
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
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold transition cursor-pointer",
                isSel
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-2xs"
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
          routeWaypoints={hasRoute ? routeWaypoints : undefined}
          onMarkerClick={(placeId) => {
            onSelectPlace(placeId)
            onClose()
          }}
        />

        {/* Bottom status bar */}
        <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 rounded-xl bg-background/90 px-3 py-1.5 text-[11px] font-bold text-foreground border border-border shadow-md backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{mapMarkers.length}</span> destinations in range
        </div>

        {/* ── Route Info Overlay Panel ── */}
        {hasRoute && store.plannedRoute && (
          <div className="absolute top-4 right-4 z-[400] w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-emerald-500/10 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-extrabold text-foreground">Driving Route</span>
              </div>
              <button
                onClick={clearPlannedRoute}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer"
                title="Clear route"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-2.5 max-h-[50vh] overflow-y-auto">
              <div className="text-[11px] font-bold text-muted-foreground">{store.plannedRoute.title}</div>

              {/* Route stops list */}
              <div className="space-y-1.5">
                {store.plannedRoute.stops.map((stop, i) => (
                  <div key={stop.placeId} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shrink-0">
                        {stop.order}
                      </span>
                      {i < store.plannedRoute!.stops.length - 1 && (
                        <div className="w-px h-4 bg-emerald-500/30 mt-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => {
                          onSelectPlace(stop.placeId)
                          onClose()
                        }}
                        className="text-[11px] font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition truncate block text-left cursor-pointer"
                      >
                        {stop.placeName}
                      </button>
                      {(stop.estimatedDriveMinutes ?? 0) > 0 && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 text-emerald-500" />
                          ~{stop.estimatedDriveMinutes} min drive from previous
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Route summary stats */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-[10px] font-bold">
                <span className="text-muted-foreground">
                  {store.plannedRoute.totalDistanceKm} km total
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{store.plannedRoute.totalDriveMinutes} min drive
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
