"use client"

import type { PlanStep } from "@/lib/agent-planner"
import { Check, Loader2, Circle, XCircle, MinusCircle } from "lucide-react"

export function AgentPlanPanel({ steps, compact = false }: { steps: PlanStep[]; compact?: boolean }) {
  if (!steps.length) return null

  if (compact) {
    const active = steps.find((s) => s.status === "active")
    const current = active ?? [...steps].reverse().find((s) => s.status === "done")
    if (!current) return null
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-xl max-w-fit shadow-2xs">
        <StepIcon status={current.status} />
        <span>{current.detail || current.label}</span>
      </div>
    )
  }

  const activeIndex = steps.findIndex((s) => s.status === "active")
  const doneCount = steps.filter((s) => s.status === "done").length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs my-2 max-w-xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200/80">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
          {activeIndex === -1 ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plan Execution Complete</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Executing Agent Plan…</span>
            </>
          )}
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          {doneCount}/{steps.length} steps
        </span>
      </div>

      <div className="p-3 space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-2.5 text-xs font-medium text-slate-700"
          >
            <div className="mt-0.5 shrink-0">
              <StepIcon status={step.status} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={step.status === "done" ? "text-slate-900 font-semibold" : step.status === "active" ? "text-emerald-900 font-bold" : "text-slate-400"}>
                {step.label}
              </div>
              {step.detail && (
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepIcon({ status }: { status: PlanStep["status"] }) {
  if (status === "done") {
    return <Check className="w-3.5 h-3.5 text-emerald-600" />
  }
  if (status === "active") {
    return <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
  }
  if (status === "skipped") {
    return <MinusCircle className="w-3.5 h-3.5 text-slate-300" />
  }
  if (status === "error") {
    return <XCircle className="w-3.5 h-3.5 text-red-500" />
  }
  return <Circle className="w-3.5 h-3.5 text-slate-300" />
}
