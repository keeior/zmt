"use client"

import { Compass, Bot, Languages, Landmark, Sparkles, ShieldCheck, TreePine } from "lucide-react"
import type { View } from "./types"

export function AboutView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-10">
      {/* ── National Flag Color Subline Accent Bar ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xs">
        <div className="grid h-3 w-full grid-cols-5 gap-1 rounded-xl overflow-hidden">
          <div className="bg-[#006400] transition-transform hover:scale-y-125" title="Green - Agriculture & Land" />
          <div className="bg-[#FFD700] transition-transform hover:scale-y-125" title="Yellow - Mineral Wealth" />
          <div className="bg-[#D21034] transition-transform hover:scale-y-125" title="Red - National Freedom" />
          <div className="bg-slate-950 dark:bg-black transition-transform hover:scale-y-125" title="Black - Heritage & Populace" />
          <div className="bg-slate-100 dark:bg-slate-200 transition-transform hover:scale-y-125 flex items-center justify-center" title="White - Peace & Unity">
            <span className="text-[7px] font-black text-amber-600">🇿🇼</span>
          </div>
        </div>
      </div>

      {/* ── Hero & Vision Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            <Landmark className="h-3.5 w-3.5" />
            House of Stone · Zimbabwe Tourism Intelligence
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Zimbabwe: A World of Wonders
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Welcome to Zimbabwe. From the majestic thunder of Victoria Falls to the ancient dry-stone architecture of Great Zimbabwe, ZimTour AI connects visitors directly with authentic local experiences, verified tourism operators, and real-time voice translation.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate("explore")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 dark:hover:bg-emerald-600 transition cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              Explore Places
            </button>

            <button
              onClick={() => onNavigate("ai")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Bot className="h-4 w-4 text-emerald-500" />
              Ask ZimTour AI
            </button>

            <button
              onClick={() => onNavigate("translate")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Languages className="h-4 w-4 text-emerald-500" />
              Live Translator
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 Tourism Pillars ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Landmark className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground">Ancient Heritage</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Great Zimbabwe monument, Khami ruins, and rich cultural traditions spanning centuries.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <TreePine className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground">Natural Wonders</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Victoria Falls, Mana Pools Zambezi reserve, Matobo granite kopjes & Lake Kariba.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground">Verified Tourism</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Directly supporting local guides, authentic community crafts, and accessible travel routes.
          </p>
        </div>
      </div>
    </div>
  )
}
