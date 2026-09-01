"use client"

import { useState } from "react"
import {
  ArrowRight,
  User,
  Mail,
  ChevronDown,
  MapPin,
  Sparkles,
} from "lucide-react"
import { setUserRole, type UserRole } from "@/lib/zimtour-store"
import type { View } from "./types"

const LOGIN_ROLE_OPTIONS: { id: UserRole; label: string; desc: string; routeView: View }[] = [
  {
    id: "tourist",
    label: "Tourist / Visitor",
    desc: "Discover places, experiences and services across Zimbabwe.",
    routeView: "home",
  },
  {
    id: "provider",
    label: "Tourism Provider",
    desc: "Manage accommodation, dining, transport and tour listings.",
    routeView: "provider",
  },
]

/* ── Four Problem Signals ── */
const PROBLEM_SIGNALS = [
  {
    id: "accessibility",
    label: "ACCESSIBILITY",
    quote: "Tourism shouldn't depend on what your body can or cannot do.",
    color: "#34d399", // emerald
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 7v5.5l-3 4.5" />
        <path d="M12 12.5h4l2 5" />
        <path d="M7 20a5 5 0 0 1 3.5-8.5" />
        <path d="M17 20a5 5 0 0 0-1-7" />
      </svg>
    ),
  },
  {
    id: "community",
    label: "LOCAL PARTICIPATION",
    quote: "Tourism value should reach the communities surrounding destinations.",
    color: "#fbbf24", // amber
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <circle cx="12" cy="5.5" r="2.5" />
        <circle cx="5" cy="17.5" r="2" />
        <circle cx="19" cy="17.5" r="2" />
        <path d="M12 8v4" />
        <path d="M9.5 14L7 15.5" />
        <path d="M14.5 14L17 15.5" />
        <circle cx="12" cy="13" r="1" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "cultural",
    label: "CULTURAL VOICE",
    quote: "Zimbabwe's heritage is more than a historical description.",
    color: "#c084fc", // violet
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 3v18" />
        <path d="M8 6v12" />
        <path d="M4 9.5v5" />
        <path d="M16 4.5v15" />
        <path d="M20 7.5v9" />
      </svg>
    ),
  },
  {
    id: "intelligence",
    label: "CONNECTED INTELLIGENCE",
    quote: "Fragmented tourism data becomes actionable intelligence.",
    color: "#38bdf8", // sky
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M7.8 7.6L16.3 16.5" opacity="0.7" />
        <path d="M8 6.5L16 7" opacity="0.7" />
        <path d="M9 17.5L16 17.8" opacity="0.7" />
        <path d="M18 9v7" opacity="0.7" />
      </svg>
    ),
  },
]

export function AuthView({
  onNavigate,
}: {
  onNavigate: (view: View) => void
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("tourist")
  const [fullName, setFullName] = useState("Tawanda Moyo")
  const [email, setEmail] = useState("tawanda@example.com")
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null)

  const activeOption = LOGIN_ROLE_OPTIONS.find((u) => u.id === selectedRole) || LOGIN_ROLE_OPTIONS[0]

  function handleLogin() {
    setUserRole(selectedRole)
    onNavigate(activeOption.routeView)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex bg-cover bg-center"
      style={{ backgroundImage: `url('/zim/bg.png')` }}
    >
      {/* Subtle warm overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/10 to-black/40" />

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes levitate-0 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes levitate-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes levitate-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes levitate-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .lev-0 { animation: levitate-0 4.5s ease-in-out infinite; }
        .lev-1 { animation: levitate-1 5.2s ease-in-out 0.8s infinite; }
        .lev-2 { animation: levitate-2 4.8s ease-in-out 1.5s infinite; }
        .lev-3 { animation: levitate-3 5.5s ease-in-out 0.3s infinite; }
        .signal-reveal {
          animation: sig-in 0.2s ease-out forwards;
        }
        @keyframes sig-in {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Left: Hero + Floating Signal Constellation (md+) ── */}
      <div className="relative hidden md:flex flex-1 flex-col">

        {/* ─── Signal Constellation ─── */}
        {/* Centered cluster in the hero area, arranged as a tight diamond */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[320px] h-[280px] lg:w-[380px] lg:h-[320px] pointer-events-auto">

            {/* Top: Accessibility — ♿ */}
            <div
              className="lev-0 absolute group"
              style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
              onMouseEnter={() => setHoveredSignal("accessibility")}
              onMouseLeave={() => setHoveredSignal(null)}
            >
              <div
                className="relative flex items-center justify-center w-[52px] h-[52px] lg:w-[58px] lg:h-[58px] rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                  background: "rgba(52,211,153,0.12)",
                  border: "1px solid rgba(52,211,153,0.35)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 24px rgba(52,211,153,0.15)",
                  color: "rgba(52,211,153,0.85)",
                }}
              >
                <div className="w-6 h-6 lg:w-7 lg:h-7">{PROBLEM_SIGNALS[0].icon}</div>
              </div>
              {hoveredSignal === "accessibility" && (
                <div className="signal-reveal absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] z-40 w-[240px]">
                  <div className="rounded-xl border border-emerald-400/20 bg-black/70 backdrop-blur-xl p-3.5 shadow-2xl">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase block mb-1" style={{ color: "#34d399" }}>Accessibility</span>
                    <p className="text-[11.5px] text-white/80 font-medium leading-relaxed italic">&ldquo;Tourism shouldn&apos;t depend on what your body can or cannot do.&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Left: Community — ◎ */}
            <div
              className="lev-1 absolute group"
              style={{ top: "42%", left: 0 }}
              onMouseEnter={() => setHoveredSignal("community")}
              onMouseLeave={() => setHoveredSignal(null)}
            >
              <div
                className="relative flex items-center justify-center w-[52px] h-[52px] lg:w-[58px] lg:h-[58px] rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.35)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 24px rgba(251,191,36,0.15)",
                  color: "rgba(251,191,36,0.85)",
                }}
              >
                <div className="w-6 h-6 lg:w-7 lg:h-7">{PROBLEM_SIGNALS[1].icon}</div>
              </div>
              {hoveredSignal === "community" && (
                <div className="signal-reveal absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-40 w-[240px]">
                  <div className="rounded-xl border border-amber-400/20 bg-black/70 backdrop-blur-xl p-3.5 shadow-2xl">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase block mb-1" style={{ color: "#fbbf24" }}>Local Participation</span>
                    <p className="text-[11.5px] text-white/80 font-medium leading-relaxed italic">&ldquo;Tourism value should reach the communities surrounding destinations.&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cultural Voice — ◉ */}
            <div
              className="lev-2 absolute group"
              style={{ top: "38%", right: 0 }}
              onMouseEnter={() => setHoveredSignal("cultural")}
              onMouseLeave={() => setHoveredSignal(null)}
            >
              <div
                className="relative flex items-center justify-center w-[52px] h-[52px] lg:w-[58px] lg:h-[58px] rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                  background: "rgba(192,132,252,0.12)",
                  border: "1px solid rgba(192,132,252,0.35)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 24px rgba(192,132,252,0.15)",
                  color: "rgba(192,132,252,0.85)",
                }}
              >
                <div className="w-6 h-6 lg:w-7 lg:h-7">{PROBLEM_SIGNALS[2].icon}</div>
              </div>
              {hoveredSignal === "cultural" && (
                <div className="signal-reveal absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-40 w-[240px]">
                  <div className="rounded-xl border border-violet-400/20 bg-black/70 backdrop-blur-xl p-3.5 shadow-2xl">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase block mb-1" style={{ color: "#c084fc" }}>Cultural Voice</span>
                    <p className="text-[11.5px] text-white/80 font-medium leading-relaxed italic">&ldquo;Zimbabwe&apos;s heritage is more than a historical description.&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Intelligence — ◌ */}
            <div
              className="lev-3 absolute group"
              style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
              onMouseEnter={() => setHoveredSignal("intelligence")}
              onMouseLeave={() => setHoveredSignal(null)}
            >
              <div
                className="relative flex items-center justify-center w-[52px] h-[52px] lg:w-[58px] lg:h-[58px] rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                  background: "rgba(56,189,248,0.12)",
                  border: "1px solid rgba(56,189,248,0.35)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 24px rgba(56,189,248,0.15)",
                  color: "rgba(56,189,248,0.85)",
                }}
              >
                <div className="w-6 h-6 lg:w-7 lg:h-7">{PROBLEM_SIGNALS[3].icon}</div>
              </div>
              {hoveredSignal === "intelligence" && (
                <div className="signal-reveal absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] z-40 w-[240px]">
                  <div className="rounded-xl border border-sky-400/20 bg-black/70 backdrop-blur-xl p-3.5 shadow-2xl">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase block mb-1" style={{ color: "#38bdf8" }}>Connected Intelligence</span>
                    <p className="text-[11.5px] text-white/80 font-medium leading-relaxed italic">&ldquo;Fragmented tourism data becomes actionable intelligence.&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle connecting lines between the four nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.12 }}>
              <line x1="50%" y1="58" x2="58" y2="50%" stroke="white" strokeWidth="1" />
              <line x1="50%" y1="58" x2="calc(100% - 58px)" y2="46%" stroke="white" strokeWidth="1" />
              <line x1="58" y1="50%" x2="50%" y2="calc(100% - 58px)" stroke="white" strokeWidth="1" />
              <line x1="calc(100% - 58px)" y1="46%" x2="50%" y2="calc(100% - 58px)" stroke="white" strokeWidth="1" />
            </svg>

          </div>
        </div>

        {/* Hero branding pinned to bottom-left */}
        <div className="relative z-10 mt-auto p-10 lg:p-14 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-lg shadow-lg">
              Z
            </div>
            <span className="text-white/80 text-[13px] font-bold tracking-widest uppercase">
              ZimTour Intelligence
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
            Discover <br />Zimbabwe
          </h1>
          <p className="max-w-sm text-[13px] text-white/70 font-medium leading-relaxed drop-shadow">
            AI-powered travel intelligence, real-time tourism data & verified local experiences across the heart of Southern Africa.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-[11px] text-white/50 font-semibold">
              <MapPin className="h-3.5 w-3.5" /> Masvingo Province
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-white/50 font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> AI-Enhanced
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: Glassmorphic Login Panel ── */}
      <div className="relative flex w-full md:w-[440px] lg:w-[480px] shrink-0 items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl md:bg-black/30 md:backdrop-blur-xl" />
        <div className="absolute inset-0 border-l border-white/10 hidden md:block" />

        <div className="relative z-10 w-full max-w-sm space-y-7">

          {/* Mobile-only branding */}
          <div className="md:hidden text-center space-y-1.5">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-lg">
              Z
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">ZimTour</h2>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-[22px] font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-[12.5px] text-white/60 font-medium">Sign in to access your platform portal.</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-white/40" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Tawanda Moyo"
                  className="w-full rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm pl-9 pr-3 py-2.5 text-[13px] font-semibold text-white placeholder:text-white/30 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-white/40" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tawanda@example.com"
                  className="w-full rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm pl-9 pr-3 py-2.5 text-[13px] font-semibold text-white placeholder:text-white/30 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Account Type</label>
              <div className="relative">
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm px-3.5 py-2.5 pr-10 text-[13px] font-extrabold text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 cursor-pointer transition">
                  {LOGIN_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-slate-900 text-white font-semibold">{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              </div>
              <p className="text-[11px] text-white/40 font-medium pt-1.5 px-0.5">{activeOption.desc}</p>
            </div>
          </div>

          {/* CTA */}
          <button type="button" onClick={handleLogin}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 active:scale-[0.98]">
            <span>{selectedRole === "tourist" ? "Explore Zimbabwe" : `Continue as ${activeOption.label}`}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="text-center text-[10.5px] text-white/25 font-medium">
            By continuing you agree to ZimTour&apos;s Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
