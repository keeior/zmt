/**
 * ZimTour Agent Planner (Simplified)
 * ------------------------------------------------------------------
 * Provides plan step types and utility exports consumed by
 * gemini-live-api.ts which now owns the sequential execution flow.
 */

export type PlanStepStatus = "pending" | "active" | "done" | "skipped" | "error"

export type PlanStep = {
  id: string
  label: string
  status: PlanStepStatus
  detail?: string
}
