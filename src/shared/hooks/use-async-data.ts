"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, isApiError } from "@/shared/api";

export interface AsyncData<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** Re-runs the loader, keeping the current data on screen meanwhile. */
  reload: () => void;
}

interface State<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

function toApiError(cause: unknown): ApiError {
  if (isApiError(cause)) return cause;

  // Not a transport failure — most likely a bug. Keep it visible in the
  // console while still giving the UI something to render.
  console.error(cause);
  return new ApiError({
    title: "Beklenmeyen hata",
    status: 0,
    detail: cause instanceof Error ? cause.message : "Bilinmeyen hata",
    errorCode: "client_error",
    traceId: "",
  });
}

/**
 * Reads data in a Client Component.
 *
 * `load` must be stable — wrap it in `useCallback` with the inputs it depends
 * on, and the hook re-runs when those change. The abort signal is passed in so
 * a superseded request can drop out instead of overwriting newer data.
 */
export function useAsyncData<T>(
  load: (signal: AbortSignal) => Promise<T>,
): AsyncData<T> {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const data = await load(controller.signal);
        if (controller.signal.aborted) return;
        setState({ data, error: null, loading: false });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setState({ data: null, error: toApiError(cause), loading: false });
      }
    })();

    return () => controller.abort();
  }, [load, attempt]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true }));
    setAttempt((previous) => previous + 1);
  }, []);

  return { ...state, reload };
}
