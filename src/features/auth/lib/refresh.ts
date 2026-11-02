import { authApi } from "../api/auth-api";
import type { AuthTokens } from "../model/auth";
import { clearTokens, getTokens, setTokens } from "../model/token-store";

let inFlight: Promise<AuthTokens | null> | null = null;

async function runRefresh(): Promise<AuthTokens | null> {
  const current = getTokens();
  if (!current) return null;

  try {
    const { tokens } = await authApi.refresh(current.refreshToken);
    setTokens(tokens);
    return tokens;
  } catch {
    // A 401 here means the session is genuinely over: the refresh token was
    // expired, revoked, or already consumed. Do not retry.
    clearTokens();
    return null;
  }
}

/**
 * Refreshes the session, at most once at a time.
 *
 * The queue is the whole point. Refresh tokens are single use, and replaying a
 * consumed one is read by the backend as a stolen token and revokes every
 * session. Three requests hitting 401 together would do exactly that, so they
 * all await the same promise instead.
 */
export function refreshSession(): Promise<AuthTokens | null> {
  if (!inFlight) {
    inFlight = runRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Refresh a little early so a token never expires mid-handshake. */
const EXPIRY_MARGIN_MS = 30_000;

/**
 * The current access token, refreshed first if it is about to expire.
 *
 * REST calls recover from an expired token by themselves (401 → refresh →
 * retry), but a SignalR handshake cannot: the connection simply fails. A room
 * left open past the 15-minute lifetime would therefore never reconnect
 * unless the token is checked before each connection attempt.
 */
export async function freshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens) return null;

  const expiresAt = Date.parse(tokens.accessTokenExpiresAtUtc);
  if (Number.isNaN(expiresAt) || expiresAt - Date.now() > EXPIRY_MARGIN_MS) {
    return tokens.accessToken;
  }

  return (await refreshSession())?.accessToken ?? null;
}

/** Test seam. */
export function resetRefreshQueue(): void {
  inFlight = null;
}
