import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-12 text-center">
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-subtle">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
