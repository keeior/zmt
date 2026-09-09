"use client"

import { Search, MapPin, Bell, Menu, Globe, ChevronDown, UserCheck, ShieldCheck, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useZimTourStore, LANGUAGE_OPTIONS, setSelectedLanguage } from "@/lib/zimtour-store"
import { useTheme } from "@/hooks/useTheme"
import type { View } from "./types"

const VIEW_TITLES: Record<View, string> = {
  auth: "Welcome to ZimTour",
  home: "Home",
  explore: "Explore",
  ai: "ZimTour AI",
  bookings: "My Bookings",
  settings: "Settings",
  listing: "Great Zimbabwe",
  admin: "Ministry Intelligence",
  provider: "Tourism Provider Portal",
  "provider-dashboard": "Provider Overview Dashboard",
  "provider-listings": "Managed Services & Listings",
  "provider-reservations": "Incoming Booking Reservations",
  "provider-verification": "ZTA Verification Vault",
  contributor: "Community & Heritage Hub",
  translate: "Global Language Translator",
  about: "About Zimbabwe",
}

const VIEW_SUBTITLES: Partial<Record<View, string>> = {
  auth: "Select your role to unlock tailored travel & tourism features.",
  explore: "Find places, activities and services around you.",
  ai: "Ask anything about travelling in Zimbabwe.",
  bookings: "Manage your reservations, tickets and payments.",
  admin: "Live overview, destination knowledge graph & national telemetry.",
  provider: "Manage listings, service availability and direct tourist bookings.",
  "provider-dashboard": "Overview metrics, direct bookings and living heritage repository.",
  "provider-listings": "Manage rooms, safari tours, transport and local attraction services.",
  "provider-reservations": "Interactive queue for incoming tourist booking requests.",
  "provider-verification": "Upload ZTA licenses, health permits & regulatory documents.",
  contributor: "Document traditional heritage, oral history and community stories.",
  translate: "Embedded Google Translate webview for tourists, local guides & vendors.",
  about: "Discover the heritage, natural wonders, and tourism intelligence of Zimbabwe.",
}

export function TopBar({
  active,
  onMenuToggle,
  onNavigate,
  onOpenLocationMap,
}: {
  active: View
  onMenuToggle: () => void
  onNavigate?: (v: View) => void
  onOpenLocationMap?: () => void
}) {
  const store = useZimTourStore()
  const { theme, toggleTheme } = useTheme()
  const isAI = active === "ai"
  const isHome = active === "home"
  const isAuth = active === "auth"
  const isBookings = active === "bookings"
  const isTranslate = active === "translate"
  const isAbout = active === "about"
  const hideHeaderSearch = isHome || isAI || isBookings || isTranslate || isAbout

  return (
    <header className="flex h-[62px] shrink-0 items-center gap-4 border-b border-border bg-card/80 px-5 backdrop-blur-sm">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Title */}
      <div className="hidden flex-col md:flex">
        <h1 className="text-[21px] font-extrabold leading-none tracking-tight text-foreground">
          {VIEW_TITLES[active]}
        </h1>
        {VIEW_SUBTITLES[active] && (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {VIEW_SUBTITLES[active]}
          </p>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search — hidden on home, ai, bookings, and live translate tabs */}
      {!hideHeaderSearch && (
        <div className="hidden min-w-0 max-w-[340px] flex-1 items-center gap-2 rounded-[10px] border border-input bg-background px-3.5 py-2 text-[13.5px] text-muted-foreground md:flex">
          <Search className="h-4 w-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Search places, activities, services…"
          />
        </div>
      )}

      {/* My Location */}
      {!isHome && (
        <button
          onClick={onOpenLocationMap}
          className="hidden items-center gap-2 rounded-[10px] border border-input bg-card px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted md:flex cursor-pointer"
        >
          <MapPin className="h-4 w-4 text-brand-600 animate-bounce-slow" />
          My Location
        </button>
      )}

      {/* Language selector — AI view only */}
      {isAI && (
        <div className="hidden items-center gap-1.5 rounded-[10px] border border-input bg-card px-2.5 py-1 text-[13px] font-semibold transition-colors hover:bg-muted md:flex">
          <Globe className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <select
            value={store.selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as any)}
            className="bg-transparent font-semibold text-foreground outline-none cursor-pointer text-xs pr-1"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-popover text-popover-foreground dark:bg-[#181a1f] dark:text-white">
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-input bg-card text-foreground transition-colors hover:bg-muted cursor-pointer"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>

      {/* Bell */}
      <button className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-input bg-card text-foreground transition-colors hover:bg-muted cursor-pointer">
        <Bell className="h-4 w-4" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
          2
        </span>
      </button>

      {/* Exit Ministry View Button (when in admin view) */}
      {active === "admin" && onNavigate && (
        <button
          onClick={() => onNavigate("home")}
          className="hidden sm:flex items-center gap-1.5 rounded-[10px] border border-border bg-muted px-3 py-1.5 text-[12.5px] font-bold text-foreground transition hover:bg-accent"
        >
          <span>← Exit Ministry Mode</span>
        </button>
      )}

      {/* Switch Role / Role Indicator (hidden on auth and admin screens) */}
      {!isAuth && active !== "admin" && onNavigate && (
        <button
          onClick={() => onNavigate("auth")}
          className="hidden sm:flex items-center gap-2 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300 shadow-2xs transition hover:bg-emerald-500/20 cursor-pointer"
        >
          <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="capitalize">{store.userRole} Role</span>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-background px-1.5 py-0.5 rounded border border-emerald-500/30">
            Switch
          </span>
        </button>
      )}

      {/* User avatar — home view shows name, others show avatar only */}
      {isHome ? (
        <button
          onClick={() => onNavigate?.("auth")}
          className="hidden items-center gap-2 rounded-[10px] border border-input bg-card px-3 py-1.5 text-left transition-colors hover:bg-muted md:flex"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3c7a5b] text-[12px] font-bold text-white">
            T
          </span>
          <span className="text-[13.5px] font-semibold">Tawanda</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ) : (
        <button
          onClick={() => onNavigate?.("auth")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3c7a5b] text-[13px] font-bold text-white transition-opacity hover:opacity-90"
        >
          T
        </button>
      )}
    </header>
  )
}
