"use client";

import { useCallback, useState, type FormEvent } from "react";

import { errorMessage, isApiError } from "@/shared/api";

export interface FormSubmit {
  pending: boolean;
  /** General failure message; empty while field errors carry the detail. */
  error: string | null;
  /** Validation messages keyed by lower-cased field name. */
  fieldErrors: Record<string, string>;
  /** Wraps an async action as an `onSubmit` handler. */
  submit: (run: () => Promise<void>) => (event: FormEvent) => Promise<void>;
  reset: () => void;
}

const NO_FIELD_ERRORS: Record<string, string> = {};

/**
 * The shape every form here shares: prevent default, lock the button, run,
 * and turn a `ProblemDetails` failure into field-level messages.
 *
 * Locking while pending also matters for Security's rate limit — a double
 * click on sign-in burns two of the five requests a minute.
 */
export function useFormSubmit(): FormSubmit {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string>>(NO_FIELD_ERRORS);

  const reset = useCallback(() => {
    setError(null);
    setFieldErrors(NO_FIELD_ERRORS);
  }, []);

  const submit = useCallback(
    (run: () => Promise<void>) => async (event: FormEvent) => {
      event.preventDefault();
      setPending(true);
      setError(null);
      setFieldErrors(NO_FIELD_ERRORS);

      try {
        await run();
      } catch (cause) {
        const fields = isApiError(cause) ? cause.fieldErrors : NO_FIELD_ERRORS;
        setFieldErrors(fields);
        // With per-field messages on screen, a second generic banner is noise.
        setError(
          Object.keys(fields).length > 0
            ? null
            : errorMessage(cause, "İşlem tamamlanamadı."),
        );
      } finally {
        setPending(false);
      }
    },
    [],
  );

  return { pending, error, fieldErrors, submit, reset };
}
