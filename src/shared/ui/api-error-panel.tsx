import type { ApiProblem } from "@/shared/api";

/**
 * Renders a failed request instead of throwing it at the error boundary. The
 * `errorCode` and `traceId` are kept visible — they are what you grep the
 * backend logs for.
 */
export function ApiErrorPanel({
  problem,
  title = "Veri alınamadı",
}: {
  problem: ApiProblem;
  title?: string;
}) {
  return (
    <div className="rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-sm">
      <p className="font-semibold text-danger">{title}</p>
      <p className="mt-1 text-danger/90">{problem.detail || problem.title}</p>
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs text-danger/80 sm:grid-cols-[auto_1fr]">
        <dt className="font-medium">errorCode</dt>
        <dd className="font-mono">{problem.errorCode}</dd>
        <dt className="font-medium">status</dt>
        <dd className="font-mono">{problem.status}</dd>
        {problem.traceId && (
          <>
            <dt className="font-medium">traceId</dt>
            <dd className="truncate font-mono">{problem.traceId}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
