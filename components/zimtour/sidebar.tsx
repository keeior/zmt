"use client"

import { useEffect, useRef, useState } from "react"
import {
  Home,
  Compass,
  Bot,
  CalendarCheck2,
  Heart,
  Info,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Building2,
  CalendarDays,
  ShieldCheck,
  Languages,
  Sun,
  Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useZimTourStore } from "@/lib/zimtour-store"
import { useTheme } from "@/hooks/useTheme"
import type { View } from "./types"

const NAV_TOURIST: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "ai", label: "ZimTour AI", icon: Bot },
  { id: "bookings", label: "Bookings", icon: CalendarCheck2 },
  { id: "translate", label: "Live Translator", icon: Languages },
]

const NAV_PROVIDER: { id: View; label: string; icon: typeof Home; badge?: string }[] = [
  { id: "provider-dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
  { id: "provider-listings", label: "My Listings", icon: Building2, badge: "5" },
  { id: "provider-reservations", label: "Reservations", icon: CalendarDays, badge: "3" },
  { id: "provider-verification", label: "Verification & Docs", icon: ShieldCheck },
]

const NAV_SECONDARY: { id: View; label: string; icon: typeof Home }[] = [
  { id: "about", label: "About Zimbabwe", icon: Info },
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar({
  active,
  onNavigate,
  onAdminClick,
}: {
  active: View
  onNavigate: (v: View) => void
  onAdminClick?: () => void
}) {
  const store = useZimTourStore()
  const { theme, toggleTheme } = useTheme()
  const isProvider = store.userRole === "provider" || active === "provider"
  const navItems = isProvider ? NAV_PROVIDER : NAV_TOURIST
  const secondaryNavItems = isProvider
    ? NAV_SECONDARY.filter((item) => item.label === "Settings")
    : NAV_SECONDARY
  const [menuOpen, setMenuOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return (
    <aside className="w-64 bg-[#032e1e] text-slate-300 flex flex-col justify-between shrink-0 border-r border-[#04422b] select-none h-full">
      <div className="p-5 flex flex-col h-full overflow-y-auto">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/40 ring-1 ring-white/20 shrink-0">
            <Compass className="w-5 h-5 text-emerald-950" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5 leading-none">
              ZimTour
              <span className="text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/80 font-medium tracking-wide mt-0.5">
              INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Brand Sub-tagline */}
        <div className="px-2 mb-6">
          <p className="text-[12px] leading-relaxed text-emerald-100/60 font-normal">
            Discover more. Stay longer. Experience Zimbabwe.
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-sm font-medium">
          {navItems.map((item, idx) => {
            const Icon = item.icon
            const isActive = active === item.id && (isProvider ? idx === 0 : true)
            return (
              <button
                key={`${item.id}-${item.label}`}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left text-sm font-medium",
                  isActive
                    ? "bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/20"
                    : "text-slate-300 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-white" : "text-emerald-400/70",
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {"badge" in item && Boolean(item.badge) && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                    {String(item.badge)}
                  </span>
                )}
              </button>
            )
          })}

          {/* Divider */}
          <div className="my-3 border-t border-white/10" />

          {/* Secondary Nav Links */}
          {secondaryNavItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left text-sm font-medium",
                  isActive
                    ? "bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/20"
                    : "text-slate-300 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-emerald-400/70")} />
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left text-sm font-medium"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-400/70 shrink-0" />
            )}
            <span className="flex-1 truncate">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>

        {/* Sidebar Bottom: User Profile */}
        <div className="pt-3 border-t border-white/10 relative" ref={boxRef}>
          {menuOpen && (
            <div className="absolute bottom-16 left-0 right-0 rounded-xl bg-[#04422b] border border-white/10 p-1 text-white shadow-xl z-50">
              <button
                onClick={() => {
                  onNavigate("settings")
                  setMenuOpen(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/10 transition"
              >
                View Profile & Settings
              </button>
              <button
                onClick={() => {
                  onNavigate("auth")
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-emerald-300 hover:bg-white/10 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                Switch User Role
              </button>
              {onAdminClick && (
                <button
                  onClick={() => {
                    onAdminClick()
                    setMenuOpen(false)
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/10 transition font-semibold"
                >
                  Ministry Intelligence Mode
                </button>
              )}
              <div className="my-1 border-t border-white/10" />
              <button
                onClick={() => {
                  onNavigate("auth")
                  setMenuOpen(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10 transition"
              >
                Log out / Switch User
              </button>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-left transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-semibold flex items-center justify-center text-xs ring-2 ring-emerald-500/30 shrink-0">
                T
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">Tawanda</p>
                <p className="text-[11px] text-slate-400 truncate">tawanda@example.com</p>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", menuOpen && "rotate-180")} />
          </button>
        </div>
      </div>
    </aside>
  )
}
