"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard } from "lucide-react"
import { Sidebar } from "@/components/zimtour/sidebar"
import { TopBar } from "@/components/zimtour/top-bar"
import { AuthView } from "@/components/zimtour/auth-view"
import { HomeView } from "@/components/zimtour/home-view"
import { ExploreView } from "@/components/zimtour/explore-view"
import { ListingView } from "@/components/zimtour/listing-view"
import { AIView } from "@/components/zimtour/ai-view"
import { BookingsView } from "@/components/zimtour/bookings-view"
import { SettingsView } from "@/components/zimtour/settings-view"
import { AdminView } from "@/components/zimtour/admin-view"
import { ProviderView } from "@/components/zimtour/provider-view"
import { ContributorView } from "@/components/zimtour/contributor-view"
import { TranslateView } from "@/components/zimtour/translate-view"
import { FullScreenMapModal } from "@/components/zimtour/full-screen-map-modal"
import { setSelectedPlaceId, setUserRole } from "@/lib/zimtour-store"
import type { View } from "@/components/zimtour/types"

import { cn } from "@/lib/utils"

export default function Page() {
  const [view, setView] = useState<View>("auth")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLocationMapOpen, setIsLocationMapOpen] = useState(false)

  // Keyboard shortcut listener:
  // Ctrl + M = Ministry Intelligence (Admin View)
  // Ctrl + Q = Tourist Mode (Home View)
  // Ctrl + K = Provider Mode (Provider Dashboard View)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (!isCtrlOrCmd) return

      if (key === "m") {
        e.preventDefault()
        setView((prev) => (prev === "admin" ? "home" : "admin"))
      } else if (key === "q") {
        e.preventDefault()
        setUserRole("tourist")
        setView("home")
      } else if (key === "k") {
        e.preventDefault()
        setUserRole("provider")
        setView("provider-dashboard")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Full-Screen Interactive Location Radar Map Modal */}
      <FullScreenMapModal
        isOpen={isLocationMapOpen}
        onClose={() => setIsLocationMapOpen(false)}
        onSelectPlace={(placeId) => {
          setSelectedPlaceId(placeId)
          setView("listing")
        }}
      />

      {/* Sidebar - hidden on auth & admin screens for dedicated, full-width views */}
      {view !== "auth" && view !== "admin" && (
        <div
          className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            active={view}
            onNavigate={(v) => {
              setView(v)
              setSidebarOpen(false)
            }}
            onAdminClick={() => setView("admin")}
          />
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {view !== "auth" && (
          <TopBar
            active={view}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
            onNavigate={setView}
            onOpenLocationMap={() => setIsLocationMapOpen(true)}
          />
        )}
        <main className={cn("flex-1 overflow-y-auto flex flex-col", view === "ai" && "overflow-hidden")}>
          {view === "auth" && <AuthView onNavigate={setView} />}
          {view === "ai" ? (
            <AIView onNavigate={setView} />
          ) : (
            <div className="mx-auto max-w-[1280px] px-5 py-6 lg:px-8 w-full flex-1">
              {view === "home" && (
                <HomeView
                  onNavigate={setView}
                  onOpenListing={() => setView("listing")}
                />
              )}
              {view === "explore" && (
                <ExploreView
                  onNavigate={setView}
                  onOpenListing={() => setView("listing")}
                  onOpenLocationMap={() => setIsLocationMapOpen(true)}
                />
              )}
              {view === "listing" && <ListingView onNavigate={setView} />}
              {view === "bookings" && <BookingsView onNavigate={setView} />}
              {view === "settings" && <SettingsView onNavigate={setView} />}
              {view === "admin" && <AdminView onNavigate={setView} />}
              {(view === "provider" || view.startsWith("provider-")) && (
                <ProviderView activeSubView={view} onNavigate={setView} />
              )}
              {view === "contributor" && <ContributorView onNavigate={setView} />}
              {view === "translate" && <TranslateView />}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
