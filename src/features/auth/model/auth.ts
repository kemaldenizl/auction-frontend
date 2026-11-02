/** The account as Security reports it after register / login. */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
}

export interface AuthTokens {
  /** Lives 15 minutes. Sent as `Authorization: Bearer …`. */
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  /** Lives 30 days, single use, rotated on every refresh. */
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface MfaChallenge {
  challengeToken: string;
  expiresAtUtc: string;
}

/**
 * Login answers in two shapes. With MFA enabled `tokens` is null and
 * `mfaChallenge` is filled — always branch on `requiresMfa`.
 */
export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens | null;
  mfaChallenge: MfaChallenge | null;
  requiresMfa: boolean;
}

export interface RegisterResult {
  user: AuthUser;
}

export interface TokenEnvelope {
  tokens: AuthTokens;
}

/** `GET /api/users/me` — the authoritative list of what this session may do. */
export interface CurrentUser {
  userId: string;
  email: string;
  sessionId: string;
  accessTokenJti: string;
  permissions: string[];
}

export interface UserSession {
  sessionId: string;
  deviceName: string | null;
  ipAddress: string | null;
  createdAtUtc: string;
  revoked: boolean;
  revokedAtUtc: string | null;
  isCurrent: boolean;
}

export interface MfaSetup {
  manualEntryKey: string;
  /** `otpauth://…` — render it as a QR code for an authenticator app. */
  otpAuthUri: string;
}

export interface MfaRecoveryCodes {
  recoveryCodes: string[];
}

export interface Permission {
  id: string;
  code: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export function isAuthUser(value: unknown): value is AuthUser {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<AuthUser>;
  return typeof candidate.id === "string" && typeof candidate.email === "string";
}

export function isAuthTokens(value: unknown): value is AuthTokens {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<AuthTokens>;
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === "string" &&
    candidate.refreshToken.length > 0
  );
}
