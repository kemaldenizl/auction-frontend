import { ApiError, type ApiProblem } from "./api-error";

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: QueryParams;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
}

export interface HttpClientOptions {
  defaults?: RequestInit;
  /**
   * Read fresh on every request rather than captured once, so a token that
   * was just refreshed is used immediately.
   */
  getAccessToken?: () => string | null;
  /**
   * Called when a request comes back 401. Resolving `true` means a usable
   * token is now available and the request is retried exactly once; `false`
   * lets the 401 surface. Implementations must serialise themselves — the
   * refresh token is single-use and replaying a consumed one kills the
   * whole session.
   */
  onUnauthorized?: () => Promise<boolean>;
}

/** Builds `?a=1&b=2`, skipping empty values so optional filters can be spread in. */
export function toQueryString(params: QueryParams = {}): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

const NETWORK_ERROR: ApiProblem = {
  title: "Sunucuya ulaşılamadı",
  status: 0,
  detail: "Sunucuya ulaşılamadı.",
  errorCode: "network_error",
  traceId: "",
};

/**
 * A `ProblemDetails` body is expected, but a proxy error or a crash can send
 * HTML instead — the fallback keeps the status code meaningful either way.
 */
async function readProblem(response: Response): Promise<ApiProblem> {
  const fallback: ApiProblem = {
    title: "İstek başarısız",
    status: response.status,
    detail: `HTTP ${response.status} ${response.statusText}`.trim(),
    errorCode: response.status === 429 ? "rate_limited" : "unknown",
    traceId: "",
  };

  const payload: unknown = await response.json().catch(() => null);
  if (payload === null || typeof payload !== "object") return fallback;

  return { ...fallback, ...(payload as Partial<ApiProblem>) };
}

function isEmptyResponse(response: Response): boolean {
  return (
    response.status === 204 ||
    response.status === 205 ||
    response.headers.get("content-length") === "0"
  );
}

export function createHttpClient(
  baseUrl: string,
  { defaults = {}, getAccessToken, onUnauthorized }: HttpClientOptions = {},
): HttpClient {
  async function fetchOnce(
    method: string,
    url: string,
    body: unknown,
    init: Omit<RequestOptions, "query">,
  ): Promise<Response> {
    const hasBody = body !== undefined;
    const token = getAccessToken?.();

    try {
      return await fetch(url, {
        ...defaults,
        ...init,
        method,
        headers: {
          ...(hasBody ? { "Content-Type": "application/json" } : null),
          ...(token ? { Authorization: `Bearer ${token}` } : null),
          ...defaults.headers,
          ...init.headers,
        },
        body: hasBody ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      throw new ApiError({
        ...NETWORK_ERROR,
        detail: cause instanceof Error ? cause.message : NETWORK_ERROR.detail,
      });
    }
  }

  async function send<T>(
    method: string,
    path: string,
    body: unknown,
    { query, ...init }: RequestOptions = {},
  ): Promise<T> {
    const url = `${baseUrl}${path}${toQueryString(query)}`;

    let response = await fetchOnce(method, url, body, init);

    // One retry, and only after the refresh succeeded. A second 401 means the
    // session is genuinely over.
    if (response.status === 401 && onUnauthorized && (await onUnauthorized())) {
      response = await fetchOnce(method, url, body, init);
    }

    if (!response.ok) {
      throw new ApiError(await readProblem(response));
    }

    if (isEmptyResponse(response)) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    get: (path, options) => send("GET", path, undefined, options),
    post: (path, body, options) => send("POST", path, body, options),
    put: (path, body, options) => send("PUT", path, body, options),
    delete: (path, options) => send("DELETE", path, undefined, options),
  };
}
