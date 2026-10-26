"use client";

import { Alert, Button } from "@/shared/ui";

/**
 * Last-resort boundary. Expected API failures are rendered inline by
 * `ApiErrorPanel`, so anything reaching here is unexpected.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Alert
      role="alert"
      tone="danger"
      title="Beklenmeyen bir hata oluştu"
      action={
        <Button variant="secondary" size="sm" onClick={reset}>
          Tekrar dene
        </Button>
      }
    >
      <p>{error.message}</p>
      {error.digest && (
        <p className="mt-0.5 font-mono text-xs">digest: {error.digest}</p>
      )}
    </Alert>
  );
}
