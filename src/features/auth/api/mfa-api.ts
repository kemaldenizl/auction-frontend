import type { HttpClient } from "@/shared/api";

import { apiHttp } from "../lib/api-http";
import type { MfaRecoveryCodes, MfaSetup, TokenEnvelope } from "../model/auth";
import { authHttp } from "./auth-api";

export interface MfaLoginBody {
  challengeToken: string;
  /** Six digits from the authenticator app… */
  totpCode?: string | null;
  /** …or one of the recovery codes, never both. */
  recoveryCode?: string | null;
}

export interface MfaDisableBody {
  totpCode?: string | null;
  recoveryCode?: string | null;
}

/**
 * `completeLogin` runs before there is a session, so it takes the plain
 * client; everything else is account management and needs the bearer token.
 */
export function createMfaApi(signedIn: HttpClient, anonymous: HttpClient) {
  return {
    completeLogin: (body: MfaLoginBody) =>
      anonymous.post<TokenEnvelope>("/api/mfa/login/complete", body),

    beginSetup: () => signedIn.post<MfaSetup>("/api/mfa/setup/begin"),

    /** Returns the recovery codes **once** — make the user save them. */
    completeSetup: (code: string) =>
      signedIn.post<MfaRecoveryCodes>("/api/mfa/setup/complete", { code }),

    disable: (body: MfaDisableBody) =>
      signedIn.post<void>("/api/mfa/disable", body),

    regenerateRecoveryCodes: (totpCode: string) =>
      signedIn.post<MfaRecoveryCodes>("/api/mfa/recovery-codes/regenerate", {
        totpCode,
      }),
  };
}

export type MfaApi = ReturnType<typeof createMfaApi>;

export const mfaApi = createMfaApi(apiHttp, authHttp);
