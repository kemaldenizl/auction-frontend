import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/cn";

const CONTROL = cn(
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg shadow-[inset_0_1px_2px] shadow-black/[0.03]",
  "placeholder:text-subtle transition-[border-color,box-shadow] duration-200",
  "hover:border-line-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
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
  return <textarea {...props} className={cn(CONTROL, "min-h-24", className)} />;
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
        <p
          id={`${id}-error`}
          className="animate-fade-in text-xs font-medium text-danger"
        >
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
