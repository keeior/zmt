import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{
        background:
          "conic-gradient(from 200deg, #2fae63, #0c2018, #2fae63)",
      }}
      aria-hidden="true"
    >
      <span
        className="absolute rounded-full"
        style={{
          inset: "18%",
          background:
            "radial-gradient(circle at 35% 30%, #ffd76a, #e2b23c 55%, transparent 56%)",
        }}
      />
    </span>
  )
}

export function BrandLockup({ subtitle = "INTELLIGENCE" }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <BrandMark className="h-9 w-9" />
      <div className="leading-tight">
        <div className="text-[17px] font-extrabold tracking-tight text-sidebar-foreground">
          ZimTour
        </div>
        <div className="text-[11px] font-bold tracking-[0.15em] text-brand-500">
          {subtitle}
        </div>
      </div>
    </div>
  )
}
