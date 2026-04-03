"use client";

import { cn } from "@/lib/utils";

interface PageLoaderProps {
  /** Text displayed below the spinner */
  message?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional className overrides */
  className?: string;
}

/**
 * Modern, animated page loading indicator.
 * Uses CSS variables so it looks identical in light and dark mode,
 * and is platform-agnostic (no system-level colour inversion issues).
 */
export function PageLoader({
  message = "Loading…",
  size = "md",
  className,
}: PageLoaderProps) {
  const ringSize = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-16 w-16" }[size];
  const dotSize = { sm: "h-1 w-1", md: "h-1.5 w-1.5", lg: "h-2 w-2" }[size];
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16",
        className,
      )}
    >
      {/* Outer ring spinner */}
      <div className="relative">
        <div
          className={cn(
            ringSize,
            "rounded-full border-[3px] border-muted-foreground/15",
          )}
        />
        <div
          className={cn(
            ringSize,
            "absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin",
          )}
        />
      </div>

      {/* Bouncing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(dotSize, "rounded-full bg-primary/70")}
            style={{
              animation: "loaderBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      {message && (
        <p className={cn(textSize, "text-muted-foreground font-medium tracking-wide")}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Skeleton block for card / section placeholders.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card animate-pulse",
        className,
      )}
    >
      <div className="p-6 space-y-4">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table-shaped skeleton for pages that load tables.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden animate-pulse", className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-muted-foreground/15 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b border-border last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-3 rounded bg-muted-foreground/10 flex-1"
              style={{ maxWidth: c === 0 ? "40%" : "100%" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
