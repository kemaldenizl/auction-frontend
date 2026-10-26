import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/cn";

const CONTROL = cn(
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg",
  "placeholder:text-subtle transition-colors",
  "hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50",
);

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, "min-h-20", className)} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, "pr-8", className)} />;
}

/**
 * The id `Field` gives its hint / error text. Pass it to the control as
 * `aria-describedby` so assistive tech reads the message with the input.
 */
export function fieldDescriptionId(id: string, hasError: boolean): string {
  return hasError ? `${id}-error` : `${id}-hint`;
}

/**
 * Label + control + hint/error wrapper.
 *
 * The `id` is required rather than generated, so the label association is
 * visible at the call site and the component stays usable on the server.
 */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
