"use client"

import { Search, MapPin, Bell } from "lucide-react"
import type { ReactNode } from "react"

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </div>
  )
}

export function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex min-w-[300px] items-center gap-2 rounded-[10px] border border-input bg-card px-3.5 py-2.5 text-[13.5px] text-muted-foreground">
      <Search className="h-4 w-4" />
      <input
        className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
      />
    </div>
  )
}

export function IconButton({
  children,
  badge,
}: {
  children: ReactNode
  badge?: number
}) {
  return (
    <button className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-input bg-card text-foreground transition-colors hover:bg-brand-50">
      {children}
      {badge != null && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

export function LocationBell() {
  return (
    <>
      <IconButton>
        <MapPin className="h-4 w-4" />
      </IconButton>
      <IconButton badge={2}>
        <Bell className="h-4 w-4" />
      </IconButton>
    </>
  )
}
