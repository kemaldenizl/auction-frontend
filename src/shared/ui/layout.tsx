import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  /** Small label above the title — section name or context. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex animate-fade-up flex-wrap items-end justify-between gap-4 pb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-subtle [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-lg font-semibold tabular text-fg">
        {value}
      </dd>
      {hint && <p className="mt-0.5 truncate text-xs text-subtle">{hint}</p>}
    </div>
  );
}
