import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

import { authApi } from "../api/auth-api";
import type { AuthTokens } from "../model/auth";
import {
  getTokens,
  resetTokenStore,
  setTokens,
} from "../model/token-store";
import { refreshSession, resetRefreshQueue } from "./refresh";

function makeTokens(suffix: string): AuthTokens {
  return {
    accessToken: `access-${suffix}`,
    accessTokenExpiresAtUtc: "2026-10-29T07:05:00Z",
    refreshToken: `refresh-${suffix}`,
    refreshTokenExpiresAtUtc: "2026-11-28T06:50:00Z",
  };
}

function unauthorized(): ApiError {
  return new ApiError({
    title: "Yetkisiz",
    status: 401,
    detail: "Refresh token geçersiz",
    errorCode: "auth.invalid_refresh_token",
    traceId: "",
  });
}

describe("refreshSession", () => {
  beforeEach(() => {
    resetTokenStore();
    resetRefreshQueue();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing without a session", async () => {
    const refresh = vi.spyOn(authApi, "refresh");

    await expect(refreshSession()).resolves.toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("stores the rotated pair, since the old refresh token is now spent", async () => {
    setTokens(makeTokens("1"));
    vi.spyOn(authApi, "refresh").mockResolvedValue({
      tokens: makeTokens("2"),
    });

    const result = await refreshSession();

    expect(result?.accessToken).toBe("access-2");
    expect(getTokens()?.refreshToken).toBe("refresh-2");
  });

  it("collapses concurrent calls into one request", async () => {
    // This is the whole point of the queue. Refresh tokens are single use and
    // replaying a consumed one is read as theft, which revokes every session —
    // so three requests hitting 401 together must not each refresh.
    setTokens(makeTokens("1"));

    let resolveRefresh: (value: { tokens: AuthTokens }) => void = () => {};
    const refresh = vi.spyOn(authApi, "refresh").mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const calls = [refreshSession(), refreshSession(), refreshSession()];
    resolveRefresh({ tokens: makeTokens("2") });
    const results = await Promise.all(calls);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith("refresh-1");
    expect(results.every((value) => value?.accessToken === "access-2")).toBe(
      true,
    );
  });

  it("allows a later refresh once the first has settled", async () => {
    setTokens(makeTokens("1"));
    const refresh = vi
      .spyOn(authApi, "refresh")
      .mockResolvedValueOnce({ tokens: makeTokens("2") })
      .mockResolvedValueOnce({ tokens: makeTokens("3") });

    await refreshSession();
    await refreshSession();

    expect(refresh).toHaveBeenCalledTimes(2);
    // The second call must send the rotated token, not the spent one.
    expect(refresh).toHaveBeenNthCalledWith(2, "refresh-2");
  });

  it("ends the session when the refresh itself is refused", async () => {
    setTokens(makeTokens("1"));
    vi.spyOn(authApi, "refresh").mockRejectedValue(unauthorized());

    await expect(refreshSession()).resolves.toBeNull();
    expect(getTokens()).toBeNull();
  });

  it("does not retry a refusal", async () => {
    setTokens(makeTokens("1"));
    const refresh = vi
      .spyOn(authApi, "refresh")
      .mockRejectedValue(unauthorized());

    await refreshSession();
    // Tokens are gone, so a follow-up call has nothing to send.
    await refreshSession();

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
