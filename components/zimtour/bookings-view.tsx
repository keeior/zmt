"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CheckCircle2,
  CalendarCheck,
  Wallet,
  Ticket,
  ChevronRight,
  Download,
  Calendar,
  XCircle,
  Users,
  CreditCard,
  Hash,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiGetAllBookings, type BookingRecord, MASTER_DATASET } from "@/lib/zimtour-api"
import { setSelectedPlaceId } from "@/lib/zimtour-store"
import { img } from "@/lib/zimtour-data"
import type { View } from "./types"

const TABS = ["Upcoming", "Completed", "Cancelled"] as const
type Tab = (typeof TABS)[number]

export function BookingsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [tab, setTab] = useState<Tab>("Upcoming")
  const [allBookings, setAllBookings] = useState<BookingRecord[]>(() => apiGetAllBookings())

  useEffect(() => {
    function handleBookingCreated() {
      setAllBookings(apiGetAllBookings())
    }
    window.addEventListener("zimtour_booking_created", handleBookingCreated)
    return () => window.removeEventListener("zimtour_booking_created", handleBookingCreated)
  }, [])

  const upcoming = useMemo(() => allBookings.filter((b) => b.status === "Confirmed"), [allBookings])
  const completed = useMemo(() => allBookings.filter((b) => b.status === "Completed"), [allBookings])
  const cancelled = useMemo(() => allBookings.filter((b) => b.status === "Cancelled"), [allBookings])

  const tabBookings: BookingRecord[] =
    tab === "Upcoming" ? upcoming : tab === "Completed" ? completed : cancelled

  const totalSpent = useMemo(
    () => allBookings.reduce((sum, b) => sum + b.totalAmountUSD, 0),
    [allBookings],
  )

  const STATS = [
    {
      icon: Ticket,
      label: "Active Bookings",
      value: String(upcoming.length),
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: CalendarCheck,
      label: "Trips Completed",
      value: String(completed.length),
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Wallet,
      label: "Total Spent",
      value: `USD $${totalSpent.toLocaleString()}`,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ]

  function resolveImage(b: BookingRecord): string {
    const place = MASTER_DATASET.find((p) => p.id === b.placeId)
    return place?.imageUrl || img(b.placeId)
  }

  function handleOpenPlaceDetails(placeId: string) {
    setSelectedPlaceId(placeId)
    onNavigate("listing")
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-8">
      {/* ── Ultra-Thin Compact Stats Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {STATS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-2xs transition hover:border-emerald-500/30"
            >
              <div className="flex items-center gap-2.5">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", s.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-sm font-extrabold text-foreground tracking-tight">{s.value}</span>
            </div>
          )
        })}
      </div>

      {/* ── Sleek Thin Tabs Header ── */}
      <div className="flex items-center justify-between border-b border-border pb-1">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const count = t === "Upcoming" ? upcoming.length : t === "Completed" ? completed.length : cancelled.length
            const isSelected = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative px-3.5 py-1.5 text-xs font-bold transition-all rounded-lg inline-flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t}
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Ultra-Thin Booking Item Rows ── */}
      {tabBookings.length > 0 ? (
        <div className="space-y-2">
          {tabBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => handleOpenPlaceDetails(b.placeId)}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs transition hover:border-emerald-500/40 hover:bg-muted/30 cursor-pointer group"
            >
              {/* Compact Thumbnail */}
              <div
                className="h-14 w-20 shrink-0 rounded-lg bg-cover bg-center border border-border/50 group-hover:scale-102 transition-transform"
                style={{ backgroundImage: `url('${resolveImage(b)}')` }}
              />

              {/* Middle Information Row */}
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {b.placeName}
                    </h4>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-500 shrink-0" />
                      {b.bookingDate}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-500 shrink-0" />
                      {b.guests} guest{b.guests > 1 ? "s" : ""}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-emerald-500 shrink-0" />
                      {b.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Pricing & Confirmation */}
                <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-0.5">
                  <span className="text-xs font-black text-foreground">
                    USD ${b.totalAmountUSD.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground">
                    <Hash className="h-2.5 w-2.5 text-emerald-500" />
                    {b.confirmationCode}
                  </span>
                </div>
              </div>

              {/* Compact Action Buttons */}
              <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenPlaceDetails(b.placeId)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer",
                    b.status === "Confirmed"
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600"
                      : "border border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  Details
                  <ExternalLink className="h-3 w-3" />
                </button>

                <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground transition hover:bg-muted cursor-pointer">
                  <Download className="h-3 w-3 text-emerald-500" />
                  Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-10 text-center shadow-2xs">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <b className="mt-2 text-xs font-extrabold text-foreground">No {tab.toLowerCase()} bookings</b>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            When you reserve trips or experiences, they&apos;ll appear here.
          </p>
          <button
            onClick={() => onNavigate("explore")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-2xs cursor-pointer"
          >
            Explore Experiences <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: BookingRecord["status"] }) {
  if (status === "Confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        Confirmed
      </span>
    )
  }
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
        <Sparkles className="h-3 w-3 text-blue-500" />
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
      <XCircle className="h-3 w-3 text-rose-500" />
      Cancelled
    </span>
  )
}
