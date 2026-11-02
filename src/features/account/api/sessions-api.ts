import type { HttpClient } from "@/shared/api";
import { apiHttp } from "@/features/auth/lib/api-http";
import type { UserSession } from "@/features/auth/model/auth";

export function createSessionsApi(http: HttpClient) {
  return {
    list: (signal?: AbortSignal) =>
      http.get<UserSession[]>("/api/sessions", { signal }),

    revoke: (sessionId: string) =>
      http.delete<void>(`/api/sessions/${sessionId}`),
  };
}

export type SessionsApi = ReturnType<typeof createSessionsApi>;

export const sessionsApi = createSessionsApi(apiHttp);
