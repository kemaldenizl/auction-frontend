import { ApiError, isApiError } from "./api-error";

export type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ApiError };

/**
 * Turns a rejected request into a value so a Server Component can render an
 * error panel instead of blowing up the whole route. Only `ApiError` is
 * absorbed — a programming mistake should still reach the error boundary.
 */
export async function attempt<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    if (isApiError(error)) return { ok: false, error };
    throw error;
  }
}
