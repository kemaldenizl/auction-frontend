import {
  browserStorage,
  readJson,
  removeKey,
  writeJson,
} from "@/shared/lib/browser-storage";

import { isAuthTokens, type AuthTokens } from "./auth";

export const TOKEN_STORAGE_KEY = "auction.tokens";

let tokens: AuthTokens | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Notified whenever the tokens are replaced or dropped. */
export function subscribeToTokens(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTokens(): AuthTokens | null {
  if (!loaded) {
    tokens = readJson(browserStorage(), TOKEN_STORAGE_KEY, isAuthTokens);
    loaded = true;
  }
  return tokens;
}

/**
 * Read fresh on every request and on every hub connection attempt, so a token
 * that was just rotated is the one that goes out.
 */
export function getAccessToken(): string | null {
  return getTokens()?.accessToken ?? null;
}

export function setTokens(next: AuthTokens): void {
  tokens = next;
  loaded = true;
  writeJson(browserStorage(), TOKEN_STORAGE_KEY, next);
  emit();
}

export function clearTokens(): void {
  tokens = null;
  loaded = true;
  removeKey(browserStorage(), TOKEN_STORAGE_KEY);
  emit();
}

/** Test seam. */
export function resetTokenStore(): void {
  tokens = null;
  loaded = false;
  listeners.clear();
}
