"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CheckCircle2,
  Clock,
  CalendarCheck,
  Wallet,
  Ticket,
  ChevronRight,
  Download,
  Calendar,
  XCircle,
  MapPin,
  Users,
  CreditCard,
  Hash,
  Sparkles,
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

  // Listen for new bookings created dynamically by AI agent or user
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

  // Dynamic stats
  const totalSpent = useMemo(
    () => allBookings.reduce((sum, b) => sum + b.totalAmountUSD, 0),
    [allBookings],
  )

  const STATS = [
    { icon: Ticket, label: "Active bookings", value: String(upcoming.length), bg: "bg-brand-50 text-brand-700" },
    { icon: CalendarCheck, label: "Trips completed", value: String(completed.length), bg: "bg-blue-50 text-blue-700" },
    { icon: Wallet, label: "Total spent", value: `USD ${totalSpent.toLocaleString()}`, bg: "bg-amber-50 text-amber-700" },
  ]

  // Resolve place image from MASTER_DATASET seed/imageUrl
  function resolveImage(b: BookingRecord): string {
    const place = MASTER_DATASET.find((p) => p.id === b.placeId)
    return place?.imageUrl || img(b.placeId)
  }

  function handleOpenPlaceDetails(placeId: string) {
    setSelectedPlaceId(placeId)
    onNavigate("listing")
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${s.bg}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[22px] font-extrabold leading-none text-foreground">
                  {s.value}
                </div>
                <div className="mt-1 text-[12px] font-medium text-muted-foreground">
                  {s.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {TABS.map((t) => {
          const count = t === "Upcoming" ? upcoming.length : t === "Completed" ? completed.length : cancelled.length
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-semibold transition-colors inline-flex items-center gap-1.5",
                tab === t
                  ? "border-brand-800 text-brand-900 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    tab === t ? "bg-brand-100 text-brand-800" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Booking list */}
      {tabBookings.length > 0 ? (
        <div className="space-y-3">
          {tabBookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition hover:shadow-md sm:flex-row sm:items-center cursor-pointer group"
              onClick={() => handleOpenPlaceDetails(b.placeId)}
            >
              {/* Thumbnail */}
              <div
                className="h-[100px] w-full shrink-0 rounded-lg bg-cover bg-center sm:w-[140px] group-hover:opacity-90 transition"
                style={{ backgroundImage: `url('${resolveImage(b)}')` }}
              />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h4 className="text-[15px] font-bold text-foreground truncate group-hover:text-brand-800 transition">
                    {b.placeName}
                  </h4>
                  <StatusBadge status={b.status} />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    {b.bookingDate}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    {b.guests} guest{b.guests > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    {b.paymentMethod}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <span className="text-[14px] font-extrabold text-foreground">
                    USD {b.totalAmountUSD.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <Hash className="h-3 w-3" />
                    {b.confirmationCode}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground italic">{b.createdAt}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenPlaceDetails(b.placeId)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[12.5px] font-bold transition",
                    b.status === "Confirmed"
                      ? "bg-brand-900 text-white hover:bg-brand-800"
                      : "border border-input bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {b.status === "Confirmed" ? "View Details" : "View Trip"}
                </button>
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-muted">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <b className="mt-3.5 text-[15px] font-bold">No {tab.toLowerCase()} bookings</b>
          <p className="mt-1 max-w-xs text-[12.5px] text-muted-foreground">
            When you have {tab.toLowerCase()} trips, they&apos;ll appear here.
          </p>
          <button
            onClick={() => onNavigate("explore")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-900 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-brand-800"
          >
            Explore experiences <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: BookingRecord["status"] }) {
  if (status === "Confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-700">
        <CheckCircle2 className="h-3 w-3" />
        Confirmed
      </span>
    )
  }
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-bold text-blue-700">
        <Sparkles className="h-3 w-3" />
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10.5px] font-bold text-red-700">
      <XCircle className="h-3 w-3" />
      Cancelled
    </span>
  )
}
