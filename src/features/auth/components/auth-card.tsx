import type { ReactNode } from "react";

import { Alert } from "@/shared/ui";

export function AuthCard({
  title,
  description,
  error,
  footer,
  children,
}: {
  title: string;
  description?: ReactNode;
  error?: string | null;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm animate-fade-up space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted">{description}</p>
        )}
      </div>

      {error && (
        <Alert role="alert" tone="danger">
          {error}
        </Alert>
      )}

      {children}

      {footer && <div className="text-sm text-muted">{footer}</div>}
    </div>
  );
}
