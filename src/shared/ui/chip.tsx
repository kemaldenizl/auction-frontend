import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/** A filter option that is a link — the selection lives in the URL. */
export function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      scroll={false}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-95 [&_svg]:size-3.5",
        active
          ? "border-transparent bg-gradient-brand text-white shadow-[0_4px_14px_-6px] shadow-brand/60"
          : "border-line bg-surface/70 text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Staggers an entrance animation: item `index` starts a little after the one
 * before it, capped so long lists do not keep the user waiting.
 */
export function stagger(index: number, step = 60, max = 480): CSSProperties {
  return { "--delay": `${Math.min(index * step, max)}ms` } as CSSProperties;
}
