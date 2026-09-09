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
  Bot,
  Sparkles,
  Utensils,
  Compass,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHead, LocationBell } from "./page-head"
import {
  useZimTourStore,
  setSelectedLanguage,
  setAIPreferences,
  toggleAccessibilityProfile,
  LANGUAGE_OPTIONS,
  type SupportedLanguage,
  type AIPreferences,
} from "@/lib/zimtour-store"
import type { View } from "./types"

const SECTIONS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "ai-prefs", icon: Bot, label: "AI & Travel Preferences" },
  { id: "language", icon: Globe, label: "Language & Region" },
  { id: "accessibility", icon: Accessibility, label: "Accessibility" },
  { id: "notifications", icon: Bell, label: "Notifications" },
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

const INTEREST_OPTIONS = [
  "History & Stone Ruins",
  "UNESCO Heritage",
  "Local Crafts & Arts",
  "Wildlife Safaris",
  "Traditional Music & Drumming",
  "Boat Cruises & Fishing",
  "Scenic Hiking & Mountains",
  "Local Shona Food & Sadza",
]

export function SettingsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [active, setActive] = useState("ai-prefs")
  const store = useZimTourStore()

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle="Manage your profile, language, AI preferences, and account."
        actions={<LocationBell />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
        {/* Sidebar Navigation */}
        <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2.5 shadow-xs lg:h-fit">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const on = active === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-all cursor-pointer",
                  on
                    ? "bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-950/20"
                    : "text-foreground hover:bg-muted/80",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", on ? "text-white" : "text-emerald-500")} />
                <span className="flex-1 truncate">{s.label}</span>
                {!on && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            )
          })}
        </nav>

        {/* Settings Detail Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          {active === "profile" && <ProfilePanel />}
          {active === "ai-prefs" && <AIPrefsPanel />}
          {active === "language" && <LanguagePanel />}
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
          {(active === "privacy" || active === "payments") && (
            <Placeholder label={SECTIONS.find((s) => s.id === active)!.label} />
          )}

          {/* Action buttons */}
          <div className="mt-8 flex justify-end gap-2.5 border-t border-border pt-5">
            <button
              onClick={() => onNavigate("home")}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-[13.5px] font-bold text-foreground hover:bg-muted transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onNavigate("ai")}
              className="rounded-xl bg-emerald-600 dark:bg-emerald-500 px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-sm cursor-pointer"
            >
              Save & Test AI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfilePanel() {
  return (
    <div className="space-y-6">
      <PanelHead title="Profile" desc="Update your personal information and explorer account." />
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-xl font-black text-white shadow-inner">
            T
          </span>
          <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-emerald-600 text-white shadow-xs">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <b className="text-base font-extrabold text-foreground">Tawanda Moyo</b>
          <div className="text-xs text-muted-foreground font-medium">
            Explorer · Masvingo, Zimbabwe · Joined 2024
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldInput label="Full name" value="Tawanda Moyo" />
        <FieldInput label="Email address" value="tawanda@zimtour.co.zw" />
        <FieldInput label="Phone number" value="+263 77 123 4567" />
        <FieldInput label="Home city / Province" value="Masvingo Province" />
      </div>
    </div>
  )
}

function AIPrefsPanel() {
  const store = useZimTourStore()
  const prefs = store.aiPreferences

  const toggleInterest = (interest: string) => {
    const current = prefs.interests || []
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest]
    setAIPreferences({ interests: updated })
  }

  return (
    <div className="space-y-6">
      <PanelHead
        title="AI Assistant & Memory Preferences"
        desc="Customize how ZimTour AI answers your queries, recommends destinations, and adapts to your travel style."
      />

      {/* Travel Style */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-emerald-500" />
          Travel Persona & Style
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(["cultural", "adventure", "relaxation", "wildlife", "family"] as const).map((style) => {
            const isSelected = prefs.travelStyle === style
            return (
              <button
                key={style}
                onClick={() => setAIPreferences({ travelStyle: style })}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-xs font-bold transition-all text-center capitalize cursor-pointer",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-2xs"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {style}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cuisine / Dietary Requirement */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Utensils className="h-3.5 w-3.5 text-amber-500" />
          Dietary & Cuisine Preferences
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              { id: "local-shona", label: "Local Shona Food" },
              { id: "none", label: "No Restrictions" },
              { id: "halal", label: "Halal Only" },
              { id: "vegetarian", label: "Vegetarian" },
              { id: "vegan", label: "Vegan" },
            ] as const
          ).map((diet) => {
            const isSelected = prefs.dietaryRequirement === diet.id
            return (
              <button
                key={diet.id}
                onClick={() => setAIPreferences({ dietaryRequirement: diet.id })}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-xs font-bold transition-all text-center cursor-pointer",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-2xs"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {diet.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Preferred AI Tone */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          AI Communication Tone
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "storyteller", label: "Storyteller", desc: "Warm, cultural & narrative" },
              { id: "concise", label: "Concise", desc: "Direct 1-2 sentence replies" },
              { id: "detailed", label: "Detailed", desc: "Comprehensive guidebook details" },
            ] as const
          ).map((tone) => {
            const isSelected = prefs.aiTone === tone.id
            return (
              <button
                key={tone.id}
                onClick={() => setAIPreferences({ aiTone: tone.id })}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-2xs"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <span className="text-xs font-extrabold">{tone.label}</span>
                <span className="text-[11px] text-muted-foreground font-normal mt-0.5">{tone.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Travel Interests Tags */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          Key Travel Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = (prefs.interests || []).includes(interest)
            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-emerald-500" />}
                {interest}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Context Text Area */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Custom AI Memory Note / Additional Context
        </label>
        <textarea
          rows={3}
          value={prefs.customContext || ""}
          onChange={(e) => setAIPreferences({ customContext: e.target.value })}
          placeholder="e.g., Traveling with family, prefer step-free accessible paths and verified guides near Masvingo."
          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
    </div>
  )
}

function LanguagePanel() {
  const store = useZimTourStore()

  const mapLangToStore = (label: string): SupportedLanguage => {
    if (label.includes("Shona")) return "shona"
    if (label.includes("English")) return "english"
    if (label.includes("Spanish")) return "spanish"
    return "other"
  }

  return (
    <div className="space-y-6">
      <PanelHead
        title="Language & Region"
        desc="Choose your preferred language for the app interface, live voice translation, and AI assistant."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LANGUAGE_OPTIONS.map((opt) => {
          const isSelected = store.selectedLanguage === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => setSelectedLanguage(opt.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer",
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold ring-1 ring-emerald-500/30 shadow-xs"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.flag}</span>
                <div>
                  <div className="text-sm font-extrabold">{opt.label}</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {opt.id === "shona" ? "Official Indigenous Language" : opt.id === "english" ? "Official Business Language" : "Global Language"}
                  </div>
                </div>
              </div>
              {isSelected && <Check className="h-5 w-5 text-emerald-500 shrink-0" />}
            </button>
          )
        })}
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
    <div className="space-y-4">
      <PanelHead title={title} desc={desc} />
      <div className="flex flex-col space-y-1">
        {prefs.map((p, i) => (
          <PrefRow key={p.label} label={p.label} initial={p.on} first={i === 0} />
        ))}
      </div>
    </div>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <PanelHead title={label} desc="Manage your settings for this section." />
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center text-muted-foreground">
        <Shield className="h-8 w-8 text-emerald-500" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {label} options configured via secure ZimTour vault.
        </p>
      </div>
    </div>
  )
}

function PanelHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}

function FieldInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        defaultValue={value}
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
      <span className="text-xs font-bold text-foreground">{label}</span>
      <button
        onClick={() => setOn((o) => !o)}
        role="switch"
        aria-checked={on}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer",
          on ? "bg-emerald-600" : "bg-muted border border-border",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-xs transition-all",
            on ? "left-6" : "left-[3px]",
          )}
        />
      </button>
    </div>
  )
}
