import { isApiError } from "@/shared/api";
import {
  browserStorage,
  readJson,
  removeKey,
  writeJson,
} from "@/shared/lib/browser-storage";

import { authApi } from "../api/auth-api";
import { usersApi } from "../api/users-api";
import { isAuthUser, type AuthTokens, type AuthUser, type CurrentUser } from "./auth";
import {
  clearTokens,
  getTokens,
  setTokens,
  subscribeToTokens,
} from "./token-store";

const USER_STORAGE_KEY = "auction.user";

export type SessionStatus = "loading" | "anonymous" | "authenticated";

/**
 * Why the session is anonymous. A deliberate sign-out navigates on its own,
 * so guarded pages must not also bounce the user to the login screen; an
 * expired session is the case where they should.
 */
export type SessionEnd = "signed-out" | "expired" | null;

export interface SessionState {
  status: SessionStatus;
  /** Last known account record; carries `emailVerified`, which `/me` omits. */
  user: AuthUser | null;
  /** Fetched fresh on every bootstrap — the source of truth for permissions. */
  identity: CurrentUser | null;
  endedBy: SessionEnd;
}

const ANONYMOUS: SessionState = {
  status: "anonymous",
  user: null,
  identity: null,
  endedBy: null,
};

const LOADING: SessionState = {
  status: "loading",
  user: null,
  identity: null,
  endedBy: null,
};

let state: SessionState = LOADING;
let bootstrapped = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function setState(next: SessionState): void {
  state = next;
  emit();
}

function readStoredUser(): AuthUser | null {
  return readJson(browserStorage(), USER_STORAGE_KEY, isAuthUser);
}

function writeStoredUser(user: AuthUser): void {
  writeJson(browserStorage(), USER_STORAGE_KEY, user);
}

/**
 * Drops local state only; it does not call the server.
 *
 * The state flips to anonymous *before* the tokens are cleared. Clearing them
 * notifies the token listener below, which ends the session if it is still
 * marked authenticated — doing it the other way round re-entered this
 * function forever and froze the sign-out button.
 */
function clearLocalSession(endedBy: Exclude<SessionEnd, null>): void {
  setState({ ...ANONYMOUS, endedBy });
  removeKey(browserStorage(), USER_STORAGE_KEY);
  clearTokens();
}

async function loadIdentity(): Promise<void> {
  try {
    const identity = await usersApi.me();
    setState({
      status: "authenticated",
      user: readStoredUser(),
      identity,
      endedBy: null,
    });
  } catch (error) {
    // `apiHttp` already tried one refresh. A 401 here means the session is
    // over; anything else (network, 500) should not log the user out.
    if (isApiError(error) && error.isUnauthorized) {
      clearLocalSession("expired");
      return;
    }
    setState({
      status: "authenticated",
      user: readStoredUser(),
      identity: null,
      endedBy: null,
    });
  }
}

async function bootstrap(): Promise<void> {
  if (!getTokens()) {
    setState(ANONYMOUS);
    return;
  }

  setState({ ...LOADING, user: readStoredUser() });
  await loadIdentity();
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);

  if (!bootstrapped) {
    bootstrapped = true;
    // The refresh queue clears the tokens when a session really ends; this
    // keeps the UI in step without every caller having to remember to.
    subscribeToTokens(() => {
      if (!getTokens() && state.status !== "anonymous") {
        clearLocalSession("expired");
      }
    });
    void bootstrap();
  }

  return () => {
    listeners.delete(listener);
  };
}

export function getSessionSnapshot(): SessionState {
  return state;
}

/** There is no storage on the server, so nothing is known yet. */
export function getSessionServerSnapshot(): SessionState {
  return LOADING;
}

export async function signIn(
  tokens: AuthTokens,
  user: AuthUser,
): Promise<void> {
  setTokens(tokens);
  writeStoredUser(user);
  setState({ ...LOADING, user });
  await loadIdentity();
}

export async function signOut(): Promise<void> {
  const tokens = getTokens();

  // Best effort: the local session is dropped either way. Logout also takes
  // effect server-side immediately, so a surviving access token is useless.
  if (tokens) {
    try {
      await authApi.logout(tokens.refreshToken, tokens.accessToken);
    } catch {
      // Already expired or revoked elsewhere — nothing left to do.
    }
  }

  clearLocalSession("signed-out");
}

export async function signOutEverywhere(): Promise<void> {
  const tokens = getTokens();

  if (tokens) {
    try {
      await authApi.logoutAll(tokens.accessToken);
    } catch {
      // Same as above.
    }
  }

  clearLocalSession("signed-out");
}

/**
 * Ends only this browser's session, without a server call — for when the
 * server side is already gone (this device's session was closed from the
 * sessions list).
 */
export function signOutLocally(): void {
  clearLocalSession("signed-out");
}

/** Re-reads permissions, e.g. after a role was granted. */
export async function refreshIdentity(): Promise<void> {
  if (!getTokens()) return;
  await loadIdentity();
}

/** Updates the cached account record after e-mail verification or change. */
export function updateStoredUser(user: AuthUser): void {
  writeStoredUser(user);
  setState({ ...state, user });
}

/** Test seam. */
export function resetSessionStore(): void {
  state = LOADING;
  bootstrapped = false;
  listeners.clear();
}
