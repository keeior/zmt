"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import {
  Users,
  Clock,
  TrendingUp,
  Globe,
  Lightbulb,
  AlertTriangle,
  PieChart as PieChartIcon,
  MapPin,
  RotateCcw,
  Radio,
  CheckCircle2,
  Maximize2,
  Minimize2,
  X,
  Star,
  Layers,
  Sparkles,
  ExternalLink,
  Send,
  Volume2,
  Bot,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { useZimTourStore, setSelectedNode, setSelectedPlaceId } from "@/lib/zimtour-store"
import { apiGetMinistryTelemetry, apiGetPlatformFinancials, apiGetAllBookings, MASTER_DATASET, type PlaceDetail } from "@/lib/zimtour-api"
import type { MapMarker } from "./leaflet-map"
import { streamGeminiLiveAI, type ChatHistoryMessage } from "@/lib/gemini-live-api"
import { speakTextByLanguage } from "@/lib/shona-speech"
import type { View } from "./types"

const LeafletMap = dynamic(() => import("./leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
})

type NodeInfo = {
  id: string
  name: string
  province: string
  lat: number
  lng: number
  zoom: number
  visitors: string
  stay: string
  ratio: string
  attractions: string[]
  radarStatus: string
  density: string
}

const NODES: NodeInfo[] = [
  {
    id: "masvingo",
    name: "Masvingo",
    province: "Masvingo Province",
    lat: -20.0597,
    lng: 30.8328,
    zoom: 11,
    visitors: "4,280",
    stay: "2.4 nights",
    ratio: "68% / 32%",
    attractions: ["Great Zimbabwe Monument", "Lake Mutirikwi", "Kyle Recreational Park"],
    radarStatus: "Heritage & Culture Node",
    density: "High",
  },
  {
    id: "vic-falls",
    name: "Victoria Falls",
    province: "Matabeleland North",
    lat: -17.9243,
    lng: 25.8572,
    zoom: 11,
    visitors: "12,450",
    stay: "3.8 nights",
    ratio: "25% / 75%",
    attractions: ["Victoria Falls National Park", "Zambezi River Safari", "Gorge Activities"],
    radarStatus: "International Hub Radar",
    density: "Peak",
  },
  {
    id: "hwange",
    name: "Hwange",
    province: "Matabeleland North",
    lat: -18.3667,
    lng: 26.5000,
    zoom: 10,
    visitors: "6,200",
    stay: "4.1 nights",
    ratio: "30% / 70%",
    attractions: ["Hwange Main Camp", "Sinamatella Reserve", "Sable Antelope Corridor"],
    radarStatus: "Wildlife Safari Corridor",
    density: "Moderate",
  },
  {
    id: "nyanga",
    name: "Nyanga",
    province: "Manicaland",
    lat: -18.2167,
    lng: 32.7500,
    zoom: 10,
    visitors: "3,100",
    stay: "2.2 nights",
    ratio: "75% / 25%",
    attractions: ["Mount Nyangani Peak", "Mutarazi Skywalk", "Nyanga Heritage Reserve"],
    radarStatus: "Eastern Highlands Ecotourism",
    density: "Moderate",
  },
  {
    id: "matobo",
    name: "Matobo",
    province: "Matabeleland South",
    lat: -20.5500,
    lng: 28.5000,
    zoom: 11,
    visitors: "2,900",
    stay: "2.5 nights",
    ratio: "55% / 45%",
    attractions: ["Matobo Hills UNESCO Site", "Rhino Sanctuary", "World's View Summit"],
    radarStatus: "Cultural Landscape Radar",
    density: "Moderate",
  },
  {
    id: "gonarezhou",
    name: "Gonarezhou",
    province: "Masvingo / Chiredzi",
    lat: -21.0500,
    lng: 31.6000,
    zoom: 10,
    visitors: "1,890",
    stay: "3.2 nights",
    ratio: "40% / 60%",
    attractions: ["Chilojo Red Cliffs", "Save River Gorge", "Chilo Wilderness Lodge"],
    radarStatus: "Wilderness Reserve Radar",
    density: "Growing",
  },
]

const NATIONAL_CENTER: [number, number] = [-19.0, 29.5]
const NATIONAL_ZOOM = 6

export function AdminView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const store = useZimTourStore()
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(store.selectedNode || null)
  const [isFullScreenMap, setIsFullScreenMap] = useState<boolean>(false)
  const [fullMapCategory, setFullMapCategory] = useState<string>("All")
  const [inspectedPlaceId, setInspectedPlaceId] = useState<string | null>(null)

  // Ask AI state
  const [aiInput, setAiInput] = useState("")
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const aiScrollRef = useRef<HTMLDivElement>(null)
  const stopAudioRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: "smooth" })
  }, [aiMessages])

  async function handleAskAI() {
    if (!aiInput.trim() || aiLoading) return
    const q = aiInput.trim()

    const history: ChatHistoryMessage[] = aiMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
    }))

    setAiMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "ai", text: "..." },
    ])
    setAiInput("")
    setAiLoading(true)

    try {
      await streamGeminiLiveAI(
        q,
        history,
        (_chunk: string, fullText: string) => {
          setAiMessages((m) => {
            const updated = [...m]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], text: fullText }
            }
            return updated
          })
        },
        undefined,
        store.selectedLanguage
      )
    } catch {
      setAiMessages((m) => {
        const updated = [...m]
        const lastIdx = updated.length - 1
        if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
          updated[lastIdx] = { ...updated[lastIdx], text: "Unable to reach the AI engine right now. Please try again." }
        }
        return updated
      })
    } finally {
      setAiLoading(false)
    }
  }

  async function speakText(text: string) {
    if (!text) return
    try {
      if (stopAudioRef.current) stopAudioRef.current()
      stopAudioRef.current = await speakTextByLanguage(text, store.selectedLanguage)
    } catch (err) {
      console.warn("Ministry AI TTS error:", err)
    }
  }

  // Dynamic telemetry from unified Local API
  const telemetry = apiGetMinistryTelemetry(store.userBookingsCount, store.userViewsCount)
  const financials = apiGetPlatformFinancials()
  const recentBookings = apiGetAllBookings()

  // Determine active node (if any)
  const activeNode = useMemo(() => {
    if (!selectedNodeName) return null
    return NODES.find((n) => n.name.toLowerCase() === selectedNodeName.toLowerCase()) || null
  }, [selectedNodeName])

  // Map position based on selected provincial node vs national view
  const mapCenter: [number, number] = activeNode
    ? [activeNode.lat, activeNode.lng]
    : NATIONAL_CENTER

  const mapZoom = activeNode ? activeNode.zoom : NATIONAL_ZOOM

  // Convert provincial nodes into LeafletMap markers for standard view
  const dashboardMarkers: MapMarker[] = useMemo(() => {
    const NODE_HEAT_COLORS: Record<string, string> = {
      "Victoria Falls": "#ef4444",
      "Masvingo": "#f97316",
      "Hwange": "#3b82f6",
      "Nyanga": "#10b981",
      "Matobo": "#8b5cf6",
      "Gonarezhou": "#ec4899",
      "Harare": "#eab308",
    }

    return NODES.map((n) => ({
      id: n.name,
      lat: n.lat,
      lng: n.lng,
      label: n.name,
      subLabel: `${n.province} · ${n.stay} avg stay`,
      badge: `${n.visitors} visitors`,
      isSelected: activeNode?.name === n.name,
      activityLevel: n.density === "Peak" ? "peak" : n.density === "High" ? "high" : "moderate",
      heatColor: NODE_HEAT_COLORS[n.name] || "#10b981",
    }))
  }, [activeNode])

  // High-Detail Markers for FULL MAP VIEW (Includes ALL places from MASTER_DATASET)
  const fullMapMarkers: MapMarker[] = useMemo(() => {
    let places = MASTER_DATASET
    if (fullMapCategory !== "All") {
      places = places.filter((p) => p.category === fullMapCategory)
    }

    return places.map((p) => {
      let activityLevel: "peak" | "high" | "moderate" | "normal" = "normal"
      let heatColor = "#3b82f6"
      if (p.reviews >= 150 || p.rating >= 4.8) {
        activityLevel = "peak"
        heatColor = "#ef4444"
      } else if (p.reviews >= 80 || p.rating >= 4.6) {
        activityLevel = "high"
        heatColor = "#f97316"
      } else if (p.reviews >= 40) {
        activityLevel = "moderate"
        heatColor = "#10b981"
      }

      return {
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        label: p.name,
        subLabel: `${p.subCategory} · ★ ${p.rating} (${p.reviews} reviews)`,
        badge: `★ ${p.rating}`,
        isSelected: inspectedPlaceId === p.id,
        activityLevel,
        heatColor,
      }
    })
  }, [fullMapCategory, inspectedPlaceId])

  const inspectedPlace: PlaceDetail | null = useMemo(
    () => MASTER_DATASET.find((p) => p.id === inspectedPlaceId) || null,
    [inspectedPlaceId],
  )

  const handleSelectNode = (nodeName: string | null) => {
    setSelectedNodeName(nodeName)
    if (nodeName) {
      setSelectedNode(nodeName)
    }
  }

  return (
    <div className="space-y-5 relative">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[12px] font-bold">Visitors</span>
            <Users className="h-4 w-4 text-brand-700" />
          </div>
          <div className="text-[24px] font-extrabold text-foreground tracking-tight">
            {telemetry.totalVisitors.toLocaleString()}
          </div>
          <span className="text-[10.5px] text-muted-foreground">
            Total recorded interactions (Local API)
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[12px] font-bold">Avg. Stay</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-[24px] font-extrabold text-foreground tracking-tight">
            {activeNode ? activeNode.stay : `${telemetry.avgStayNights} nights`}
          </div>
          <span className="text-[10.5px] text-muted-foreground">
            {activeNode ? `Provincial average (${activeNode.province})` : "National average length of stay"}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[12px] font-bold">Local / Intl</span>
            <Globe className="h-4 w-4 text-violet-600" />
          </div>
          <div className="text-[24px] font-extrabold text-foreground tracking-tight">
            {activeNode ? activeNode.ratio : `${telemetry.localRatio}% / ${telemetry.intlRatio}%`}
          </div>
          <span className="text-[10.5px] text-muted-foreground">
            {activeNode ? `Visitor ratio in ${activeNode.name}` : "Visitor origin breakdown"}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[12px] font-bold">Tourism Activity</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-[24px] font-extrabold text-emerald-600 tracking-tight">
            ↑ {telemetry.activityTrend}%
          </div>
          <span className="text-[10.5px] text-muted-foreground">
            + {store.userBookingsCount} new bookings this session
          </span>
        </div>
      </div>



      {/* Origin Distribution Pie Chart & Provincial Radar Interactive Map */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
        {/* Origin Pie Chart Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <b className="text-[13.5px] font-bold flex items-center gap-1.5">
              <PieChartIcon className="h-4 w-4 text-brand-700" />
              Visitor Origin Split
            </b>
            <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Live API
            </span>
          </div>

          {/* SVG Circular Pie / Donut Chart */}
          <div className="relative flex justify-center py-2">
            <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />

              {/* Segment 1: Domestic 62% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#1c4d32"
                strokeWidth="6"
                strokeDasharray="62 38"
                strokeDashoffset="0"
              />

              {/* Segment 2: Regional 24% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#2563eb"
                strokeWidth="6"
                strokeDasharray="24 76"
                strokeDashoffset="-62"
              />

              {/* Segment 3: International 14% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeDasharray="14 86"
                strokeDashoffset="-86"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[18px] font-extrabold text-foreground leading-none">
                {telemetry.localRatio}%
              </span>
              <span className="text-[10px] text-muted-foreground">Domestic</span>
            </div>
          </div>

          {/* Pie Chart Legend */}
          <div className="space-y-1.5 text-[11.5px] border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1c4d32]" />
                Domestic (Zimbabwe)
              </span>
              <b className="font-bold">{telemetry.localRatio}%</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Regional (SADC)
              </span>
              <b className="font-bold">24%</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                International (EU & USA)
              </span>
              <b className="font-bold">{telemetry.intlRatio}%</b>
            </div>
          </div>
        </div>

        {/* Map & Context Panel */}
        <div className="space-y-3">
          {/* Header & Regional Selector Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-extrabold text-foreground flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                Provincial Tourism Radar
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Click any regional marker to inspect provincial radar, or launch full map mode.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen Map Toggle Button */}
              <button
                onClick={() => setIsFullScreenMap(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-900 px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-brand-800 shadow-sm"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Full Map View
              </button>

              {/* Reset to National View */}
              {activeNode && (
                <button
                  onClick={() => handleSelectNode(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[11.5px] font-bold text-foreground transition hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  National View
                </button>
              )}
            </div>
          </div>

          {/* Quick Node Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <button
              onClick={() => handleSelectNode(null)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold transition",
                !activeNode
                  ? "bg-brand-900 text-white shadow-2xs"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border",
              )}
            >
              🇿🇼 All Zimbabwe (National)
            </button>

            {NODES.map((n) => {
              const isSel = activeNode?.name === n.name
              return (
                <button
                  key={n.id}
                  onClick={() => handleSelectNode(n.name)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition flex items-center gap-1.5",
                    isSel
                      ? "bg-brand-900 text-white shadow-2xs ring-2 ring-brand-600/40"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", isSel ? "bg-emerald-400" : "bg-brand-700")} />
                  {n.name}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
            {/* Standard Dashboard Map Container (hidden when full screen map is active) */}
            <div className="relative">
              {!isFullScreenMap && (
                <>
                  <LeafletMap
                    markers={dashboardMarkers}
                    center={mapCenter}
                    zoom={mapZoom}
                    height="340px"
                    variant="ministry"
                    onMarkerClick={(id) => handleSelectNode(id)}
                  />

                  {/* Status overlay badge on map */}
                  <div className="absolute top-3 left-3 z-[400] rounded-xl bg-black/75 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 shadow-md">
                    <span className="text-emerald-400 font-bold mr-1">📍 View:</span>
                    {activeNode ? (
                      <span>
                        <strong className="text-white font-bold">{activeNode.name}</strong> ({activeNode.province})
                      </span>
                    ) : (
                      <span>National Overview (Zoom level: 6)</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Provincial Telemetry Detail Card */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-brand-700 tracking-wider">
                      {activeNode ? activeNode.province : "National Radar"}
                    </span>
                    <h4 className="text-[18px] font-extrabold text-foreground">
                      {activeNode ? activeNode.name : "Zimbabwe Overview"}
                    </h4>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-800 border border-brand-200">
                    {activeNode ? activeNode.density : "All Nodes"}
                  </span>
                </div>

                <div className="space-y-2.5 text-[12px]">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Radar Status:</span>
                    <b className="text-brand-900 font-bold text-[11.5px]">
                      {activeNode ? activeNode.radarStatus : "6 Regional Nodes Active"}
                    </b>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Recorded Visitors:</span>
                    <b className="text-foreground font-extrabold">
                      {activeNode ? activeNode.visitors : telemetry.totalVisitors.toLocaleString()}
                    </b>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Average Stay:</span>
                    <b className="text-foreground font-bold">
                      {activeNode ? activeNode.stay : `${telemetry.avgStayNights} nights`}
                    </b>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Local / Intl:</span>
                    <b className="text-foreground font-bold">
                      {activeNode ? activeNode.ratio : `${telemetry.localRatio}% / ${telemetry.intlRatio}%`}
                    </b>
                  </div>

                  {/* Key Provincial Attractions */}
                  <div className="pt-1">
                    <span className="block text-muted-foreground mb-1 text-[11px] font-semibold">
                      Key Regional Attractions:
                    </span>
                    <ul className="space-y-1 text-[11.5px]">
                      {(activeNode
                        ? activeNode.attractions
                        : ["Great Zimbabwe National Monument", "Victoria Falls National Park", "Hwange Safari Park"]
                      ).map((attr) => (
                        <li key={attr} className="flex items-center gap-1.5 text-foreground font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-700 shrink-0" />
                          {attr}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIsFullScreenMap(true)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-brand-900 py-2.5 text-[12px] font-bold text-white transition hover:bg-brand-800 shadow-xs"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Full Map View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* ── AI ANALYSIS & RECOMMENDATIONS ── */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between border-b border-border pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-[14px] font-extrabold text-foreground tracking-tight">AI Intelligence & Regional Insights</h3>
              <p className="text-[11px] text-muted-foreground">Synthesized regional tourism findings for Masvingo and surrounding hubs</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10.5px] font-extrabold">
            Active Synthesis
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {/* AI Analysis */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-700" />
              <h4 className="text-[13px] font-extrabold text-foreground">AI Analysis</h4>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Masvingo is showing strong domestic tourism activity, with visitors increasingly exploring experiences beyond major attractions. However, tourism activity remains concentrated around a small number of destinations.
            </p>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-700" />
              <h4 className="text-[13px] font-extrabold text-foreground">AI Recommendations</h4>
            </div>
            <ul className="space-y-1.5 text-[11.5px] text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Promote nearby cultural and recreational experiences to encourage visitors to extend their stay and distribute tourism activity across more local destinations.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Prioritise under-discovered attractions with high visitor potential and strengthen their digital visibility.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Improve accessibility information across tourism listings to make more experiences discoverable to a wider range of visitors.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── ASK AI INTELLIGENCE PANEL ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-800 text-white shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[13.5px] font-extrabold text-foreground">Ask AI Intelligence</h3>
              <p className="text-[10.5px] text-muted-foreground">Query live platform data with Groq AI</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold">Live API</span>
        </div>

        {/* Messages */}
        <div ref={aiScrollRef} className="max-h-[220px] overflow-y-auto p-3 space-y-2.5 bg-background/50">
          {aiMessages.length === 0 && (
            <div className="py-6 text-center space-y-2">
              <Sparkles className="h-6 w-6 mx-auto text-brand-400" />
              <p className="text-[12px] text-muted-foreground">
                Ask about visitor flows, provider stats, accessibility gaps, or heritage data.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {["Visitor trends in Masvingo?", "Which listings need accessibility updates?", "Top rated providers?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setAiInput(q); }}
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground hover:border-brand-400 hover:text-brand-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {aiMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-900 text-white font-semibold"
                    : "bg-muted text-foreground border border-border"
                }`}
              >
                {msg.text}
                {msg.role === "ai" && msg.text !== "..." && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700 hover:text-brand-900 transition"
                    title="Replay with voice"
                  >
                    <Volume2 className="h-3 w-3" /> Replay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border px-3 py-2.5 bg-card">
          <input
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
            placeholder="Ask about platform data, trends, accessibility..."
            className="flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={handleAskAI}
            disabled={aiLoading || !aiInput.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-900 text-white disabled:opacity-40 hover:bg-brand-800 transition shadow-xs"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── FULL SCREEN HIGH-DETAIL INTERACTIVE MAP OVERLAY ── */}
      {/* ========================================================================= */}
      {isFullScreenMap && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-4 py-3 shadow-md gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-extrabold text-foreground leading-snug flex items-center gap-2">
                  High-Detail Tourism Heatmap
                  <span className="rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-extrabold px-2.5 py-0.5 border border-emerald-200">
                    Live Telemetry ({fullMapMarkers.length} locations)
                  </span>
                </h2>
                <p className="text-[11.5px] text-muted-foreground">
                  Coordinate-pinned location dots colored by real-time tourist activity density.
                </p>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
                {(["All", "Places", "Experiences", "Stay", "Get Around", "Services", "Emergency & Health"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFullMapCategory(cat)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                      fullMapCategory === cat
                        ? "bg-brand-900 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Close Fullscreen Button */}
              <button
                onClick={() => setIsFullScreenMap(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-[12.5px] font-bold text-foreground transition hover:bg-muted shadow-2xs"
              >
                <X className="h-4 w-4" />
                Close Full Map
              </button>
            </div>
          </div>

          {/* Full Screen Map Body with Overlay Inspector */}
          <div className="relative flex-1 w-full overflow-hidden">
            {/* The Full Viewport Leaflet Map */}
            <LeafletMap
              markers={fullMapMarkers}
              center={mapCenter}
              zoom={mapZoom}
              height="100%"
              variant="ministry"
              onMarkerClick={(id) => setInspectedPlaceId(id)}
            />

            {/* Floating Heatmap Activity Legend */}
            <div className="absolute top-4 left-4 z-[400] rounded-2xl bg-card/95 backdrop-blur-md p-3.5 border border-border shadow-xl space-y-2 max-w-[240px]">
              <b className="text-[12px] font-extrabold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-700" />
                Activity Density Legend
              </b>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                  <span className="font-bold text-foreground">Peak Activity</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">&gt; 150 reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-600" />
                  <span className="font-semibold text-foreground">High Traffic</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">&gt; 80 reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="font-semibold text-foreground">Moderate Activity</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">&gt; 40 reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-400 border border-slate-300" />
                  <span className="text-muted-foreground">Standard Listing</span>
                </div>
              </div>
            </div>

            {/* Floating Location Inspector Card (When a place dot is clicked) */}
            {inspectedPlace && (
              <div className="absolute bottom-6 right-6 z-[400] w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-md border border-border p-4 shadow-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="rounded-md bg-brand-900 px-2 py-0.5 text-[10px] font-bold text-white">
                      {inspectedPlace.subCategory}
                    </span>
                    <h3 className="text-[16px] font-extrabold text-foreground">
                      {inspectedPlace.name}
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground">
                      {inspectedPlace.location} · {inspectedPlace.distanceKm} km away
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectedPlaceId(null)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Image & Description */}
                <div
                  className="h-28 w-full rounded-xl bg-cover bg-center border border-border"
                  style={{ backgroundImage: `url('${inspectedPlace.imageUrl}')` }}
                />
                <p className="text-[12px] text-muted-foreground line-clamp-2">
                  {inspectedPlace.desc}
                </p>

                {/* Stats & Nav button */}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <div className="flex items-center gap-1.5 text-[12.5px]">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <b className="font-extrabold text-foreground">{inspectedPlace.rating}</b>
                    <span className="text-muted-foreground text-[11px]">({inspectedPlace.reviews} reviews)</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlaceId(inspectedPlace.id)
                      setIsFullScreenMap(false)
                      onNavigate("listing")
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-900 px-3.5 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-brand-800 shadow-xs"
                  >
                    View Details
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
