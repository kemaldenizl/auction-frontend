import { createHttpClient, type HttpClient } from "@/shared/api";
import { env } from "@/shared/config/env";

import type {
  AuthTokens,
  LoginResult,
  RegisterResult,
  TokenEnvelope,
} from "../model/auth";

export interface Credentials {
  email: string;
  password: string;
}

/**
 * The identity endpoints.
 *
 * These take a *plain* client with no bearer header and no 401 retry: a failed
 * login must surface as a 401, and the refresh call itself must never trigger
 * another refresh.
 */
export function createAuthApi(http: HttpClient) {
  return {
    register: (credentials: Credentials) =>
      http.post<RegisterResult>("/api/auth/register", credentials),

    /** Check `requiresMfa` before using `tokens` — it is null during a challenge. */
    login: (credentials: Credentials) =>
      http.post<LoginResult>("/api/auth/login", credentials),

    /**
     * Rotates both tokens. The new refresh token must be stored; replaying a
     * consumed one is treated as theft and revokes the whole session.
     */
    refresh: (refreshToken: string) =>
      http.post<TokenEnvelope>("/api/auth/refresh", { refreshToken }),

    logout: (refreshToken: string, accessToken: string) =>
      http.post<void>(
        "/api/auth/logout",
        { refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),

    logoutAll: (accessToken: string) =>
      http.post<void>("/api/auth/logout-all", undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),

    verifyEmail: (token: string) =>
      http.post<void>("/api/auth/verify-email", { token }),

    /** Always 202, even for an unknown address — do not leak who is registered. */
    resendVerification: (email: string) =>
      http.post<void>("/api/auth/resend-verification", { email }),

    forgotPassword: (email: string) =>
      http.post<void>("/api/auth/forgot-password", { email }),

    resetPassword: (token: string, newPassword: string) =>
      http.post<void>("/api/auth/reset-password", { token, newPassword }),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;

/** No bearer header, no retry — see the note on `createAuthApi`. */
export const authHttp = createHttpClient(env.apiUrl);

export const authApi = createAuthApi(authHttp);

export type { AuthTokens };
