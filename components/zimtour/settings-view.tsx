"use client"

import { useState } from "react"
import {
  User,
  Bell,
  Accessibility,
  Globe,
  Shield,
  CreditCard,
  ChevronRight,
  Camera,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHead, LocationBell } from "./page-head"
import type { View } from "./types"

const SECTIONS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "accessibility", icon: Accessibility, label: "Accessibility" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "language", icon: Globe, label: "Language & Region" },
  { id: "privacy", icon: Shield, label: "Privacy & Security" },
  { id: "payments", icon: CreditCard, label: "Payment methods" },
]

const ACCESS_PREFS = [
  { label: "Show accessible experiences first", on: true },
  { label: "Highlight step-free routes", on: true },
  { label: "Prefer guided assistance options", on: false },
  { label: "Larger text & high contrast", on: false },
]

const NOTIF_PREFS = [
  { label: "Booking confirmations", on: true },
  { label: "Price drops & offers", on: true },
  { label: "Nearby experiences", on: false },
  { label: "Travel tips & culture", on: true },
]

const LANGS = ["English", "Shona", "Ndebele", "French"]

export function SettingsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [active, setActive] = useState("profile")

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle="Manage your profile, preferences and account."
        actions={<LocationBell />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2.5 shadow-sm lg:h-fit">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const on = active === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors",
                  on
                    ? "bg-brand-700 font-semibold text-white"
                    : "text-secondary-foreground hover:bg-brand-50",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{s.label}</span>
                {!on && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            )
          })}
        </nav>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {active === "profile" && <ProfilePanel />}
          {active === "accessibility" && (
            <PrefPanel
              title="Accessibility"
              desc="Tailor how experiences are shown to match your needs."
              prefs={ACCESS_PREFS}
            />
          )}
          {active === "notifications" && (
            <PrefPanel
              title="Notifications"
              desc="Choose what you'd like to hear about."
              prefs={NOTIF_PREFS}
            />
          )}
          {active === "language" && <LanguagePanel />}
          {(active === "privacy" || active === "payments") && (
            <Placeholder label={SECTIONS.find((s) => s.id === active)!.label} />
          )}

          <div className="mt-6 flex justify-end gap-2.5 border-t border-border pt-5">
            <button
              onClick={() => onNavigate("home")}
              className="rounded-[10px] border border-input px-5 py-2.5 text-[13.5px] font-semibold text-secondary-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button className="rounded-[10px] bg-brand-700 px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-brand-600">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfilePanel() {
  return (
    <div>
      <PanelHead title="Profile" desc="Update your personal information." />
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#3c7a5b] text-[26px] font-bold text-white">
            T
          </span>
          <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-brand-700 text-white">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <b className="text-[15px]">Tawanda Moyo</b>
          <div className="text-[13px] text-muted-foreground">
            Explorer · Joined 2024
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldInput label="Full name" value="Tawanda Moyo" />
        <FieldInput label="Email" value="tawanda@example.com" />
        <FieldInput label="Phone" value="+263 77 123 4567" />
        <FieldInput label="Home city" value="Masvingo" />
      </div>
    </div>
  )
}

function PrefPanel({
  title,
  desc,
  prefs,
}: {
  title: string
  desc: string
  prefs: { label: string; on: boolean }[]
}) {
  return (
    <div>
      <PanelHead title={title} desc={desc} />
      <div className="flex flex-col">
        {prefs.map((p, i) => (
          <PrefRow key={p.label} label={p.label} initial={p.on} first={i === 0} />
        ))}
      </div>
    </div>
  )
}

function LanguagePanel() {
  const [lang, setLang] = useState("English")
  return (
    <div>
      <PanelHead
        title="Language & Region"
        desc="Choose your preferred language for the app and AI assistant."
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={cn(
              "flex items-center justify-between rounded-[10px] border px-3.5 py-3 text-[13.5px] font-semibold transition-colors",
              lang === l
                ? "border-brand-700 bg-brand-50 text-brand-800"
                : "border-input hover:bg-muted",
            )}
          >
            {l}
            {lang === l && <Check className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div>
      <PanelHead title={label} desc="Manage your settings for this section." />
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">
        <Shield className="h-7 w-7" />
        <p className="mt-2.5 text-[13.5px]">
          {label} settings will appear here.
        </p>
      </div>
    </div>
  )
}

function PanelHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-[18px] font-extrabold">{title}</h3>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{desc}</p>
    </div>
  )
}

function FieldInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        defaultValue={value}
        className="w-full rounded-[10px] border border-input bg-background px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
      />
    </label>
  )
}

function PrefRow({
  label,
  initial,
  first,
}: {
  label: string
  initial: boolean
  first: boolean
}) {
  const [on, setOn] = useState(initial)
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3.5",
        !first && "border-t border-border",
      )}
    >
      <span className="text-[13.5px] font-medium">{label}</span>
      <button
        onClick={() => setOn((o) => !o)}
        role="switch"
        aria-checked={on}
        className={cn(
          "relative h-6 w-[42px] shrink-0 rounded-full transition-colors",
          on ? "bg-brand-600" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all",
            on ? "left-[21px]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  )
}
