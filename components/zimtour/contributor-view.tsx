"use client"

import { useState } from "react"
import {
  BookOpen,
  Plus,
  ShieldCheck,
  Award,
  FileText,
  Video,
  Image as ImageIcon,
  Share2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  MapPin,
} from "lucide-react"
import type { View } from "./types"

export function ContributorView({
  onNavigate,
}: {
  onNavigate: (v: View) => void
}) {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  const contributions = [
    {
      id: "1",
      title: "Ancient Shona Dry Stone Masonry Oral History",
      type: "Oral History & Video",
      date: "2 days ago",
      author: "Elder Sekuru Masvosva",
      verified: true,
      views: 1240,
      likes: 184,
      desc: "Architectural memory and traditional stonemasonry techniques passed down through generations around the Hill Complex.",
    },
    {
      id: "2",
      title: "Lake Mutirikwi Indigenous Bird Calling Guide",
      type: "Cultural Knowledge",
      date: "1 week ago",
      author: "Masvingo Heritage Circle",
      verified: true,
      views: 890,
      likes: 112,
      desc: "Traditional Shona folklore and seasonal migration patterns of local waterbirds along the Mutirikwi basin.",
    },
    {
      id: "3",
      title: "Traditional Mbira Tuning & Sacred Drumming Songs",
      type: "Audio Archive",
      date: "2 weeks ago",
      author: "Murewa Cultural Ensemble",
      verified: true,
      views: 2150,
      likes: 340,
      desc: "High fidelity recordings of ancestral Mbira dzaVadzimu acoustic tunings and rainmaking ceremony chants.",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Contributor Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-brand-950 via-amber-950 to-brand-900 p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-[11.5px] font-bold text-amber-300 border border-amber-500/30">
            <BookOpen className="h-3.5 w-3.5" />
            Community & Heritage Contributor Hub
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Preserving Zimbabwe's Living Heritage & Culture
          </h2>
          <p className="text-[13px] text-white/80">
            Share oral histories, traditional practices, media and cultural stories verified for tourists & researchers.
          </p>
        </div>

        <button
          onClick={() => setShowSubmissionModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-[13.5px] font-extrabold text-brand-950 shadow-md transition hover:bg-amber-300 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Share Cultural Story
        </button>
      </div>

      {/* Verified Status Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[14px] font-extrabold text-emerald-900">
              Verified Heritage Contributor Status Active
            </h4>
            <p className="text-[12px] text-emerald-800">
              Your cultural stories automatically receive official verification badges on ZimTour.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
          Badge: #HERITAGE-VERIFIED-882
        </span>
      </div>

      {/* Feed of Contributions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Verified Community Submissions ({contributions.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {contributions.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-3 hover:border-amber-400/50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-50 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 border border-amber-200">
                    {item.type}
                  </span>
                  <span className="text-[12px] text-muted-foreground">• {item.date}</span>
                </div>
                <span className="flex items-center gap-1 text-[11.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Heritage
                </span>
              </div>

              <div>
                <h4 className="text-[16px] font-extrabold text-foreground">{item.title}</h4>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">By {item.author}</span>
                <div className="flex items-center gap-4 font-bold">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-amber-600" /> {item.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5 text-brand-600" /> {item.views} views
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4 border border-border">
            <h3 className="text-lg font-extrabold text-foreground">Share Heritage & Stories</h3>
            <p className="text-[12.5px] text-muted-foreground">
              Document traditional customs, historical folklore, audio recordings or photos to enrich the ZimTour knowledge base.
            </p>
            <input
              placeholder="Title of Cultural Story / Artifact"
              className="w-full rounded-xl border border-input p-3 text-[13px] bg-background"
            />
            <textarea
              rows={3}
              placeholder="Describe the cultural story, historical background or significance..."
              className="w-full rounded-xl border border-input p-3 text-[13px] bg-background resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="rounded-xl px-4 py-2 text-[13px] font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="rounded-xl bg-amber-500 px-5 py-2 text-[13px] font-extrabold text-brand-950"
              >
                Publish Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
