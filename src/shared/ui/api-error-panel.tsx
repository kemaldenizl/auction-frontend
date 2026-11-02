import { CloudOff } from "lucide-react";

import { messageForProblem, type ApiProblem } from "@/shared/api";

/**
 * Renders a failed request in place of the content it was meant to load.
 * Only a plain-language message is shown; codes and trace ids are for logs.
 */
export function ApiErrorPanel({
  problem,
  title = "Bu içerik şu an yüklenemedi",
}: {
  problem: ApiProblem;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="animate-fade-up rounded-card border border-danger/25 bg-danger-soft/60 px-6 py-10 text-center"
    >
      <span className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-danger-soft text-danger">
        <CloudOff className="size-5" />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        {messageForProblem(problem)}
      </p>
    </div>
  );
}
