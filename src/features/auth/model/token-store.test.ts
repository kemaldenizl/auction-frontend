import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuthTokens } from "./auth";
import {
  TOKEN_STORAGE_KEY,
  clearTokens,
  getAccessToken,
  getTokens,
  resetTokenStore,
  setTokens,
  subscribeToTokens,
} from "./token-store";

const TOKENS: AuthTokens = {
  accessToken: "access-1",
  accessTokenExpiresAtUtc: "2026-10-29T07:05:00Z",
  refreshToken: "refresh-1",
  refreshTokenExpiresAtUtc: "2026-11-28T06:50:00Z",
};

afterEach(() => {
  resetTokenStore();
  window.localStorage.clear();
});

describe("token store", () => {
  it("has no token before anything is stored", () => {
    expect(getTokens()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("persists the pair so a reload keeps the session", () => {
    setTokens(TOKENS);

    expect(getAccessToken()).toBe("access-1");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toContain(
      "refresh-1",
    );
  });

  it("reads what a previous page left behind", () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(TOKENS));

    expect(getAccessToken()).toBe("access-1");
  });

  it("ignores a malformed or incomplete payload", () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, '{"accessToken":""}');

    expect(getTokens()).toBeNull();
  });

  it("drops everything on clear", () => {
    setTokens(TOKENS);
    clearTokens();

    expect(getTokens()).toBeNull();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("notifies subscribers on change, which is how the UI signs out", () => {
    const listener = vi.fn();
    subscribeToTokens(listener);

    setTokens(TOKENS);
    clearTokens();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
