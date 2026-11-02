import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function Card({
  className,
  interactive = false,
  children,
}: {
  className?: string;
  /** Lifts and glows on hover — for cards that are links. */
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand [&_svg]:size-4">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-subtle">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
