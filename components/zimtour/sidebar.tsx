"use client"

import { useEffect, useRef, useState } from "react"
import {
  Home,
  Compass,
  MessageSquare,
  CalendarDays,
  Heart,
  Info,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Settings,
  Building2,
  ListPlus,
  Receipt,
  ShieldCheck,
  Briefcase,
  Layers,
  Languages,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useZimTourStore } from "@/lib/zimtour-store"
import { BrandLockup } from "./logo"
import type { View } from "./types"

const NAV_TOURIST: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "ai", label: "AI Assistant", icon: MessageSquare },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "translate", label: "Live Translator", icon: Languages },
]

const NAV_PROVIDER: { id: View; label: string; icon: typeof Home; badge?: string }[] = [
  { id: "provider-dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
  { id: "provider-listings", label: "My Listings", icon: Building2, badge: "5" },
  { id: "provider-reservations", label: "Reservations", icon: CalendarDays, badge: "3" },
  { id: "provider-verification", label: "Verification & Docs", icon: ShieldCheck },
]

const NAV_SECONDARY: { id: View; label: string; icon: typeof Home }[] = [
  { id: "settings", label: "Favourites", icon: Heart },
  { id: "settings", label: "About Zimbabwe", icon: Info },
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
    <aside className="flex h-full w-[182px] shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-brand-950 to-brand-900 px-3 py-5 text-sidebar-foreground">
      <div className="px-1">
        <BrandLockup />
        <p className="mt-3 mb-5 text-[12px] leading-relaxed text-brand-500/80">
          Discover more. Stay longer. Experience Zimbabwe.
        </p>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item, idx) => {
          const Icon = item.icon
          const isActive = active === item.id && (isProvider ? idx === 0 : true)
          return (
            <button
              key={`${item.id}-${item.label}`}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors",
                isActive
                  ? "bg-brand-700/80 font-semibold text-white"
                  : "text-brand-100/75 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0",
                  isActive ? "opacity-100 text-emerald-400" : "opacity-75",
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && Boolean(item.badge) && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-300 border border-emerald-500/30">
                  {String(item.badge)}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-3 border-t border-white/10" />

      {/* Secondary nav */}
      <nav className="flex flex-col gap-0.5">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.id)}
              className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium text-brand-100/65 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Icon className="h-[17px] w-[17px] shrink-0 opacity-70" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom section: User menu only */}
      <div className="mt-auto pt-3">
        <div ref={boxRef} className="relative border-t border-white/10 pt-3">
          {menuOpen && (
            <div className="absolute bottom-14 left-1 right-1 rounded-[10px] bg-white p-1.5 text-foreground shadow-[0_10px_30px_rgba(0,0,0,.25)]">
              <button
                onClick={() => {
                  onNavigate("settings")
                  setMenuOpen(false)
                }}
                className="block w-full rounded-md px-2.5 py-2 text-left text-[13px] text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
              >
                View profile
              </button>
              <button
                onClick={() => {
                  onNavigate("auth")
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-semibold text-brand-700 hover:bg-brand-50"
              >
                <Compass className="h-3.5 w-3.5" />
                Switch User Role
              </button>
              <button
                onClick={() => {
                  onNavigate("settings")
                  setMenuOpen(false)
                }}
                className="block w-full rounded-md px-2.5 py-2 text-left text-[13px] text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
              >
                Settings
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  onNavigate("auth")
                  setMenuOpen(false)
                }}
                className="block w-full rounded-md px-2.5 py-2 text-left text-[13px] text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
              >
                Log out / Switch User
              </button>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-[10px] p-1.5 text-left transition-colors hover:bg-white/[0.06]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3c7a5b] text-[12px] font-bold text-white">
              T
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[13px] font-semibold text-white">
                Tawanda
              </span>
              <span className="block truncate text-[10.5px] text-brand-500/75">
                tawanda@example.com
              </span>
            </span>
            {menuOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-brand-100/50" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-brand-100/50" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
