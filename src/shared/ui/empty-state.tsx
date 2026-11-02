import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon = <Inbox />,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-up rounded-card border border-dashed border-line-strong/70 bg-surface/50 px-6 py-14 text-center">
      <span className="mx-auto mb-4 grid size-12 animate-float place-items-center rounded-2xl bg-brand-soft text-brand [&_svg]:size-5">
        {icon}
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-subtle">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
