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
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl max-w-fit shadow-2xs">
        <StepIcon status={current.status} />
        <span>{current.detail || current.label}</span>
      </div>
    )
  }

  const activeIndex = steps.findIndex((s) => s.status === "active")
  const doneCount = steps.filter((s) => s.status === "done").length

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs my-2 max-w-xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b border-border">
        <span className="text-xs font-bold text-foreground flex items-center gap-2">
          {activeIndex === -1 ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Plan Execution Complete</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span>Executing Agent Plan…</span>
            </>
          )}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {doneCount}/{steps.length} steps
        </span>
      </div>

      <div className="p-3 space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-2.5 text-xs font-medium text-foreground"
          >
            <div className="mt-0.5 shrink-0">
              <StepIcon status={step.status} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={step.status === "done" ? "text-foreground font-semibold" : step.status === "active" ? "text-emerald-500 font-bold" : "text-muted-foreground"}>
                {step.label}
              </div>
              {step.detail && (
                <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
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
