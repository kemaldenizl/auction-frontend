import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function DescriptionList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <dl className={cn("divide-y divide-line text-sm", className)}>
      {children}
    </dl>
  );
}

export function DescriptionItem({
  term,
  children,
  mono = false,
}: {
  term: ReactNode;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-muted">{term}</dt>
      <dd className={cn("min-w-0 break-words text-fg", mono && "font-mono text-xs")}>
        {children}
      </dd>
    </div>
  );
}
