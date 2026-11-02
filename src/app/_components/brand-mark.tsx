import { Gavel } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Mezat ana sayfa"
      className={cn(
        "group inline-flex items-center gap-2.5 font-semibold tracking-tight text-fg",
        className,
      )}
    >
      <span className="relative grid size-8 place-items-center rounded-xl bg-gradient-brand text-white shadow-[0_6px_16px_-6px] shadow-brand/70 transition-transform duration-500 ease-spring group-hover:-rotate-12 group-hover:scale-110">
        <Gavel className="size-4" />
      </span>
      <span className="text-lg">Mezat</span>
    </Link>
  );
}
