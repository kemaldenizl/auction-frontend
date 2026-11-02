import { cn } from "@/shared/lib/cn";

/** A sheen sweeps across instead of a flat pulse — reads as "loading". */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-xl bg-[linear-gradient(90deg,var(--surface-muted)_0%,var(--line)_50%,var(--surface-muted)_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
