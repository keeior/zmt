"use client"

import { useEffect, useRef, useCallback } from "react"

/* ── Types ── */
export type MapMarker = {
  id: string
  lat: number
  lng: number
  label: string
  subLabel?: string
  badge?: string
  imageUrl?: string
  description?: string
  rating?: number
  reviews?: number
  isSelected?: boolean
  category?: string
  activityLevel?: "peak" | "high" | "moderate" | "normal"
  heatColor?: string
}

type LeafletMapProps = {
  markers: MapMarker[]
  center: [number, number]
  zoom: number
  minZoom?: number
  maxZoom?: number
  lockZoomIn?: boolean
  height?: string
  previewMode?: "compact" | "expanded"
  variant?: "tourist" | "ministry"
  onMarkerClick?: (id: string) => void
}

export function LeafletMap({
  markers,
  center,
  zoom,
  minZoom = 6,
  maxZoom = 18,
  lockZoomIn = true,
  height = "340px",
  previewMode = "compact",
  variant = "tourist",
  onMarkerClick,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const leafletLRef = useRef<any>(null)

  // Render mobile-game style pins
  const updateMarkers = useCallback(
    (L: any, mkrs: MapMarker[]) => {
      if (!markersLayerRef.current || !L) return
      markersLayerRef.current.clearLayers()

      const isMinistry = variant === "ministry"

      mkrs.forEach((m) => {
        const isSel = m.isSelected
        const cat = (m.category || "").toLowerCase()
        const sub = (m.subLabel || "").toLowerCase()

        let iconSymbol = "📍"
        let pinClass = "zt-pin-default"

        if (isSel) {
          iconSymbol = "⭐"
          pinClass = "zt-pin-selected"
        } else if (cat.includes("stay") || cat.includes("lodge") || sub.includes("hotel") || sub.includes("resort")) {
          iconSymbol = "🏨"
          pinClass = "zt-pin-stay"
        } else if (cat.includes("thing") || cat.includes("experience") || cat.includes("tour")) {
          iconSymbol = "✨"
          pinClass = "zt-pin-exp"
        } else if (cat.includes("food") || cat.includes("drink") || sub.includes("dining") || sub.includes("restaurant") || sub.includes("cafe")) {
          iconSymbol = "🍽️"
          pinClass = "zt-pin-food"
        } else if (cat.includes("around") || cat.includes("car") || sub.includes("shuttle") || sub.includes("taxi") || sub.includes("hire")) {
          iconSymbol = "🚗"
          pinClass = "zt-pin-transit"
        } else if (cat.includes("service") || sub.includes("shopping") || sub.includes("shop") || sub.includes("market") || sub.includes("fuel")) {
          iconSymbol = sub.includes("fuel") ? "⛽" : "🛍️"
          pinClass = "zt-pin-service"
        } else if (cat.includes("emergency") || cat.includes("health") || sub.includes("hospital") || sub.includes("police") || sub.includes("clinic")) {
          iconSymbol = sub.includes("police") ? "🚓" : "🏥"
          pinClass = "zt-pin-emergency"
        } else if (cat.includes("place") || sub.includes("heritage") || sub.includes("park") || sub.includes("wonder")) {
          iconSymbol = "🏛️"
          pinClass = "zt-pin-heritage"
        }

        let pinHtml = ""
        if (isMinistry) {
          const activityColors: Record<string, string> = {
            peak: "#ef4444",
            high: "#f97316",
            moderate: "#10b981",
            normal: "#3b82f6",
          }
          const defaultColor = activityColors[m.activityLevel || "normal"] || "#10b981"
          const nodeColor = isSel ? "#fbbf24" : (m.heatColor || defaultColor)

          pinHtml = `
            <div class="zt-node-pin ${isSel ? "zt-node-pin--selected" : ""}" style="--node-color: ${nodeColor};">
              <div class="zt-node-core"></div>
              <div class="zt-node-ring"></div>
            </div>
          `
        } else {
          pinHtml = `
            <div class="zt-game-pin ${pinClass} ${isSel ? "zt-game-pin--selected" : ""}">
              <div class="zt-pin-head">
                <span class="zt-pin-icon">${iconSymbol}</span>
              </div>
              <div class="zt-pin-pointer"></div>
              ${isSel ? '<span class="zt-pin-pulse"></span>' : ""}
            </div>
          `
        }

        const icon = L.divIcon({
          className: "leaflet-zimtour-game-pin",
          html: pinHtml,
          iconSize: [32, 38],
          iconAnchor: [16, 38],
          popupAnchor: [0, -36],
        })

        const marker = L.marker([m.lat, m.lng], { icon })

        // Floating hover preview card (compact vs expanded)
        const isExpanded = previewMode === "expanded"

        const hoverTooltipHtml = isExpanded
          ? `
          <div class="zt-map-hover-preview zt-map-hover-preview--expanded">
            ${
              m.imageUrl
                ? `
              <div class="zt-hover-banner" style="background-image: url('${m.imageUrl}')">
                ${m.badge ? `<span class="zt-hover-badge-overlay">${m.badge}</span>` : ""}
                ${m.rating ? `<span class="zt-hover-rating-overlay">⭐ ${m.rating}</span>` : ""}
              </div>`
                : ""
            }
            <div class="zt-hover-body-expanded">
              <div class="zt-hover-title-lg">${m.label}</div>
              ${m.subLabel ? `<div class="zt-hover-sub-lg">${m.subLabel}</div>` : ""}
              ${m.description ? `<p class="zt-hover-desc">${m.description}</p>` : ""}
              <div class="zt-hover-cta">Click pin to open location →</div>
            </div>
          </div>
        `
          : `
          <div class="zt-map-hover-preview">
            ${m.imageUrl ? `<div class="zt-hover-img" style="background-image: url('${m.imageUrl}')"></div>` : ""}
            <div class="zt-hover-content">
              <div class="zt-hover-header">
                <span class="zt-hover-title">${m.label}</span>
                ${m.badge ? `<span class="zt-hover-badge">${m.badge}</span>` : ""}
              </div>
              ${m.subLabel ? `<div class="zt-hover-sub">${m.subLabel}</div>` : ""}
              <div class="zt-hover-footer">Click pin to open location</div>
            </div>
          </div>
        `

        marker.bindTooltip(hoverTooltipHtml, {
          direction: "top",
          offset: [0, -36],
          className: isExpanded ? "zt-leaflet-tooltip-floating zt-tooltip-lg" : "zt-leaflet-tooltip-floating",
          opacity: 1,
          sticky: true,
        })

        marker.on("click", () => {
          onMarkerClick?.(m.id)
        })

        markersLayerRef.current?.addLayer(marker)
      })
    },
    [onMarkerClick, previewMode],
  )

  // Initialize Leaflet map safely client-side
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapInstanceRef.current) return
    let isMounted = true

    async function initMap() {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")

      if (!isMounted || !containerRef.current || mapInstanceRef.current) return

      leafletLRef.current = L

      const targetMin = minZoom ?? 6
      const targetMax = lockZoomIn ? zoom : maxZoom

      const map = L.map(containerRef.current, {
        center,
        zoom,
        minZoom: targetMin,
        maxZoom: targetMax,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map
      markersLayerRef.current = L.layerGroup().addTo(map)

      updateMarkers(L, markers)
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersLayerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current && leafletLRef.current) {
      updateMarkers(leafletLRef.current, markers)
    }
  }, [markers, updateMarkers])

  // Smoothly animate map when center changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current
      const targetMin = minZoom ?? 6
      const targetMax = lockZoomIn ? zoom : maxZoom

      map.setMinZoom(targetMin)
      map.setMaxZoom(targetMax)

      map.flyTo(center, zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      })
    }
  }, [center, zoom, lockZoomIn, minZoom, maxZoom])

  return (
    <>
      <style>{`
        .leaflet-zimtour-game-pin {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Mobile Game Pin Base */
        .zt-game-pin {
          position: relative;
          width: 32px;
          height: 38px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
        }
        .zt-game-pin:hover {
          transform: translateY(-4px) scale(1.18);
          z-index: 99999 !important;
        }

        .zt-pin-head {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3);
          z-index: 2;
        }

        .zt-pin-icon {
          font-size: 14px;
          line-height: 1;
        }

        .zt-pin-pointer {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 9px solid #1e293b;
          margin-top: -3px;
          z-index: 1;
        }

        .zt-pin-pulse {
          position: absolute;
          bottom: 2px;
          width: 14px;
          height: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          animation: zt-pin-shadow-pulse 1.5s infinite ease-in-out;
          z-index: 0;
        }

        /* Game Pin Themes */
        .zt-pin-selected .zt-pin-head {
          background: linear-gradient(135deg, #fbbf24 0%, #b45309 100%);
          border-color: #fef08a;
          box-shadow: 0 0 14px #f59e0b;
        }
        .zt-pin-selected .zt-pin-pointer {
          border-top-color: #b45309;
        }

        .zt-pin-heritage .zt-pin-head {
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        }
        .zt-pin-heritage .zt-pin-pointer { border-top-color: #047857; }

        .zt-pin-stay .zt-pin-head {
          background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
        }
        .zt-pin-stay .zt-pin-pointer { border-top-color: #4338ca; }

        .zt-pin-exp .zt-pin-head {
          background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);
        }
        .zt-pin-exp .zt-pin-pointer { border-top-color: #7e22ce; }

        .zt-pin-food .zt-pin-head {
          background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
        }
        .zt-pin-food .zt-pin-pointer { border-top-color: #c2410c; }

        .zt-pin-transit .zt-pin-head {
          background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%);
        }
        .zt-pin-transit .zt-pin-pointer { border-top-color: #0f766e; }

        .zt-pin-service .zt-pin-head {
          background: linear-gradient(135deg, #ec4899 0%, #be123c 100%);
        }
        .zt-pin-service .zt-pin-pointer { border-top-color: #be123c; }

        .zt-pin-emergency .zt-pin-head {
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
        }
        .zt-pin-emergency .zt-pin-pointer { border-top-color: #b91c1c; }

        .zt-pin-default .zt-pin-head {
          background: linear-gradient(135deg, #475569 0%, #1e293b 100%);
        }
        .zt-pin-default .zt-pin-pointer { border-top-color: #1e293b; }

        /* Sleek custom popup styling */
        .zt-leaflet-popup-wrapper .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 14px !important;
          padding: 8px 12px !important;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35) !important;
        }
        .zt-leaflet-popup-wrapper .leaflet-popup-tip {
          background: #0f172a !important;
        }

        .zt-map-popup {
          font-family: inherit;
          min-width: 140px;
        }
        .zt-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .zt-popup-title {
          font-size: 12.5px;
          font-weight: 800;
          color: #ffffff;
        }
        .zt-popup-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .zt-popup-sub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .zt-popup-footer {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 4px;
        }

        /* Ministry Telemetry Glowing Node Pin Styles */
        .zt-node-pin {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .zt-node-core {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: var(--node-color, #10b981);
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 12px var(--node-color, #10b981);
          transition: transform 0.2s ease;
        }
        .zt-node-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid var(--node-color, #10b981);
          animation: zt-node-ping 2s infinite cubic-bezier(0, 0, 0.2, 1);
          opacity: 0.6;
        }
        .zt-node-pin--selected .zt-node-core {
          transform: scale(1.3);
          border-color: #fbbf24;
          box-shadow: 0 0 16px #fbbf24;
        }
        @keyframes zt-node-ping {
          75%, 100% {
            transform: scale(1.7);
            opacity: 0;
          }
        }

        /* Direct Leaflet Tooltip Wrapper Overrides - Fixes text overflow & containment */
        .leaflet-tooltip.zt-leaflet-tooltip-floating {
          position: absolute !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
          background: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          border-radius: 18px !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65) !important;
          overflow: hidden !important;
          width: 320px !important;
          min-width: 320px !important;
          max-width: 320px !important;
          text-align: left !important;
        }

        .leaflet-tooltip.zt-leaflet-tooltip-floating::before {
          border-top-color: #0f172a !important;
        }

        .leaflet-tooltip.zt-leaflet-tooltip-floating.zt-tooltip-compact {
          width: 270px !important;
          min-width: 270px !important;
          max-width: 270px !important;
          border-radius: 14px !important;
        }

        .zt-map-hover-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          width: 100%;
          box-sizing: border-box;
          text-align: left;
        }

        .zt-hover-img {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .zt-hover-content {
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .zt-hover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .zt-hover-title {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          text-align: left;
        }

        .zt-hover-badge {
          background: rgba(16, 185, 129, 0.25);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.45);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          white-space: nowrap;
          shrink: 0;
        }

        .zt-hover-sub {
          font-size: 11px;
          color: #94a3b8;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          text-align: left;
          margin-top: 2px;
        }

        .zt-hover-footer {
          font-size: 10px;
          color: #38bdf8;
          font-weight: 800;
          margin-top: 4px;
          text-align: left;
        }

        /* Expanded Floating Preview Card (Full Screen Mode) */
        .zt-map-hover-preview--expanded {
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
          padding: 0 !important;
          text-align: left;
        }

        .zt-hover-banner {
          position: relative;
          width: 100%;
          height: 140px;
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-sizing: border-box;
        }

        .zt-hover-badge-overlay {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(15, 23, 42, 0.85);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.5);
          font-size: 11px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .zt-hover-rating-overlay {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.85);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.4);
          font-size: 11px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .zt-hover-body-expanded {
          padding: 14px 16px 14px 16px;
          background: #0f172a;
          box-sizing: border-box;
          width: 100%;
          text-align: left;
        }

        .zt-hover-title-lg {
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.35;
          letter-spacing: -0.01em;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          text-align: left;
          margin: 0;
          padding: 0;
        }

        .zt-hover-sub-lg {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
          margin-top: 3px;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          text-align: left;
        }

        .zt-hover-desc {
          font-size: 11.5px;
          color: #cbd5e1;
          margin-top: 8px;
          line-height: 1.45;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          text-align: left;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .zt-hover-cta {
          font-size: 11px;
          font-weight: 800;
          color: #38bdf8;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }

        @keyframes zt-pin-shadow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0.8; }
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded-2xl overflow-hidden border border-border/80 shadow-2xs"
      />
    </>
  )
}
