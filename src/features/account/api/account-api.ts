import type { HttpClient } from "@/shared/api";
import { apiHttp } from "@/features/auth/lib/api-http";

/**
 * Both change flows are "request → token by e-mail → confirm".
 *
 * `token` is optional in the request response: a deployment with no mail
 * transport may echo it back for convenience, in which case the form can
 * prefill the second step. When it is absent the user pastes it from the
 * e-mail, which is the documented path.
 */
export interface ChangeRequestResult {
  token?: string;
}

export function createAccountApi(http: HttpClient) {
  return {
    requestPasswordChange: (currentPassword: string) =>
      http.post<ChangeRequestResult>("/api/auth/change-password/request", {
        currentPassword,
      }),

    confirmPasswordChange: (token: string, newPassword: string) =>
      http.post<void>("/api/auth/change-password/confirm", {
        token,
        newPassword,
      }),

    requestEmailChange: (currentPassword: string) =>
      http.post<ChangeRequestResult>("/api/auth/change-email/request", {
        currentPassword,
      }),

    /** Resolves when the token is still usable; rejects otherwise. */
    validateEmailChange: (token: string) =>
      http.get<void>("/api/auth/change-email/validate", { query: { token } }),

    confirmEmailChange: (token: string, newEmail: string) =>
      http.post<void>("/api/auth/change-email/confirm", { token, newEmail }),
  };
}

export type AccountApi = ReturnType<typeof createAccountApi>;

export const accountApi = createAccountApi(apiHttp);
