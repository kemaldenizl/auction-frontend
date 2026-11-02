import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "../api/auth-api";
import { usersApi } from "../api/users-api";
import type { AuthTokens, AuthUser, CurrentUser } from "./auth";
import {
  getSessionSnapshot,
  resetSessionStore,
  signIn,
  signOut,
  signOutLocally,
  subscribeToSession,
} from "./session-store";
import { clearTokens, getTokens, resetTokenStore } from "./token-store";

const TOKENS: AuthTokens = {
  accessToken: "access-1",
  accessTokenExpiresAtUtc: "2099-01-01T00:00:00Z",
  refreshToken: "refresh-1",
  refreshTokenExpiresAtUtc: "2099-01-01T00:00:00Z",
};

const USER: AuthUser = {
  id: "u-1",
  email: "kemal@example.com",
  emailVerified: true,
  isActive: true,
};

const IDENTITY: CurrentUser = {
  userId: "u-1",
  email: "kemal@example.com",
  sessionId: "s-1",
  accessTokenJti: "jti-1",
  permissions: ["products.manage"],
};

async function signedIn() {
  subscribeToSession(() => {});
  await signIn(TOKENS, USER);
  expect(getSessionSnapshot().status).toBe("authenticated");
}

describe("session store", () => {
  beforeEach(() => {
    vi.spyOn(usersApi, "me").mockResolvedValue(IDENTITY);
    vi.spyOn(authApi, "logout").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetSessionStore();
    resetTokenStore();
    window.localStorage.clear();
  });

  it("signs in and loads the permissions", async () => {
    await signedIn();

    expect(getSessionSnapshot().identity?.permissions).toEqual([
      "products.manage",
    ]);
  });

  it("signs out without re-entering itself", async () => {
    // Regression: clearing the tokens notified the token listener, which saw a
    // session still marked authenticated and cleared it again — forever. The
    // sign-out button span until the stack overflowed and nothing happened.
    await signedIn();

    await expect(signOut()).resolves.toBeUndefined();

    expect(getSessionSnapshot()).toMatchObject({
      status: "anonymous",
      endedBy: "signed-out",
    });
    expect(getTokens()).toBeNull();
    expect(authApi.logout).toHaveBeenCalledWith("refresh-1", "access-1");
  });

  it("still signs out locally when the server call fails", async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new Error("offline"));
    await signedIn();

    await signOut();

    expect(getSessionSnapshot().status).toBe("anonymous");
    expect(getTokens()).toBeNull();
  });

  it("marks a session that ran out as expired, not signed out", async () => {
    // Guarded pages send an expired session to the login screen, but leave a
    // deliberate sign-out to navigate on its own.
    await signedIn();

    clearTokens();

    expect(getSessionSnapshot()).toMatchObject({
      status: "anonymous",
      endedBy: "expired",
    });
  });

  it("can end only this device's session without calling the server", async () => {
    await signedIn();

    signOutLocally();

    expect(getSessionSnapshot().endedBy).toBe("signed-out");
    expect(authApi.logout).not.toHaveBeenCalled();
  });
});
