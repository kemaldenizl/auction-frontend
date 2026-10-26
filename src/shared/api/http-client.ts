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
  detail: "API adresine bağlanılamadı. Gateway çalışıyor mu?",
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
    errorCode: "unknown",
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
  defaults: RequestInit = {},
): HttpClient {
  async function send<T>(
    method: string,
    path: string,
    body: unknown,
    { query, ...init }: RequestOptions = {},
  ): Promise<T> {
    const hasBody = body !== undefined;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}${toQueryString(query)}`, {
        ...defaults,
        ...init,
        method,
        headers: {
          ...(hasBody ? { "Content-Type": "application/json" } : null),
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
