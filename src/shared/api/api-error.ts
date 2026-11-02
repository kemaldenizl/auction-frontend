import { messageForProblem, translateFieldMessage } from "./error-messages";

/**
 * RFC 7807 `ProblemDetails` as every service returns it, plus the fields the
 * backend adds: `errorCode` to branch on, `errors` for field-level validation,
 * and `minimumRequired` when a bid was below the allowed floor.
 */
export interface ApiProblem {
  title: string;
  status: number;
  detail: string;
  errorCode: string;
  traceId: string;
  /** Same value as `traceId`; both are sent for historical reasons. */
  correlationId?: string;
  minimumRequired?: number;
  errors?: Record<string, string[]>;
}

/** Thrown by the HTTP client for any non-2xx response or transport failure. */
export class ApiError extends Error {
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.problem = problem;
  }

  get status(): number {
    return this.problem.status;
  }

  /**
   * Branch on this, never on `detail` — the text can change, the code is the
   * contract.
   */
  get errorCode(): string {
    return this.problem.errorCode;
  }

  /** The floor the server asked for, when a bid was rejected as too low. */
  get minimumRequired(): number | undefined {
    return this.problem.minimumRequired;
  }

  get traceId(): string {
    return this.problem.traceId || this.problem.correlationId || "";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Token missing, expired or revoked. Refresh once, then sign out. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Signed in but lacking the permission — the button should not have shown. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Security throttles its sensitive endpoints to 5 requests per minute. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /**
   * Validation messages keyed by form field, lower-cased because the server
   * names fields in PascalCase (`Password`) while inputs use camelCase.
   */
  get fieldErrors(): Record<string, string> {
    const errors = this.problem.errors;
    if (!errors) return {};

    // The server reports every failed rule (length, uppercase, digit…) in
    // English; each becomes a short Turkish hint, duplicates dropped.
    return Object.fromEntries(
      Object.entries(errors)
        .filter(([, messages]) => messages.length > 0)
        .map(([field, messages]) => [
          field.toLowerCase(),
          [...new Set(messages.map(translateFieldMessage))].join(" "),
        ]),
    );
  }

  /** Plain-language text for the user; `message` stays the raw detail. */
  get userMessage(): string {
    return messageForProblem(this.problem);
  }
}

/**
 * An error whose message was written for the end user and can be shown as-is.
 * Anything else is described generically.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Message for any thrown value — never the raw technical detail. */
export function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return messageForProblem(error.problem, fallback);
  if (error instanceof UserFacingError) return error.message;
  return fallback;
}
