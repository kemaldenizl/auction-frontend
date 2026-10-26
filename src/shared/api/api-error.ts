/**
 * RFC 7807 `ProblemDetails` as the backend returns it, plus the two fields it
 * adds: `errorCode` for branching in code and `minimumRequired` when a bid was
 * below the allowed floor.
 */
export interface ApiProblem {
  title: string;
  status: number;
  detail: string;
  errorCode: string;
  traceId: string;
  minimumRequired?: number;
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

  get errorCode(): string {
    return this.problem.errorCode;
  }

  /** The floor the server asked for, when a bid was rejected as too low. */
  get minimumRequired(): number | undefined {
    return this.problem.minimumRequired;
  }

  get isNotFound(): boolean {
    return this.problem.status === 404;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
