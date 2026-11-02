import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  withUrl: vi.fn<(url: string, options: Record<string, unknown>) => void>(),
}));

vi.mock("@microsoft/signalr", () => {
  class HubConnectionBuilder {
    withUrl(url: string, options: Record<string, unknown>) {
      mocks.withUrl(url, options);
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return {
        state: "Disconnected",
        start: vi.fn(),
        stop: vi.fn(),
        invoke: vi.fn(),
        on: vi.fn(),
        onreconnecting: vi.fn(),
        onreconnected: vi.fn(),
        onclose: vi.fn(),
      };
    }
  }

  return {
    HubConnectionBuilder,
    HubConnectionState: { Connected: "Connected" },
    HttpTransportType: { WebSockets: 1 },
    LogLevel: { Information: 1, Warning: 3 },
  };
});

const { createSignalRAuctionHub } = await import("./signalr-auction-hub");
const { clearTokens, resetTokenStore, setTokens } = await import(
  "@/features/auth/model/token-store"
);
const { authApi } = await import("@/features/auth/api/auth-api");
const { resetRefreshQueue } = await import("@/features/auth/lib/refresh");

const IN_AN_HOUR = () => new Date(Date.now() + 3_600_000).toISOString();
const IN_TEN_SECONDS = () => new Date(Date.now() + 10_000).toISOString();

function tokens(accessToken: string, expiresAt = IN_AN_HOUR()) {
  return {
    accessToken,
    accessTokenExpiresAtUtc: expiresAt,
    refreshToken: `refresh-for-${accessToken}`,
    refreshTokenExpiresAtUtc: "2099-01-01T00:00:00Z",
  };
}

type TokenFactory = () => Promise<string>;

function connectOptions() {
  return mocks.withUrl.mock.calls[0][1];
}

afterEach(() => {
  mocks.withUrl.mockClear();
  vi.restoreAllMocks();
  resetRefreshQueue();
  resetTokenStore();
  window.localStorage.clear();
});

describe("createSignalRAuctionHub", () => {
  it("connects to the hub path through the gateway", () => {
    createSignalRAuctionHub();

    expect(mocks.withUrl.mock.calls[0][0]).toMatch(/\/hubs\/auction$/);
  });

  it("hands SignalR a token factory rather than a fixed token", async () => {
    // A browser cannot set headers on the WebSocket handshake, so the token
    // travels as ?access_token=. The factory matters because a connection is
    // only authenticated while it is being established: a reconnect after a
    // rotation has to pick up the current token, not the one from startup.
    setTokens(tokens("token-1"));
    createSignalRAuctionHub();

    const factory = connectOptions().accessTokenFactory as TokenFactory;
    await expect(factory()).resolves.toBe("token-1");

    setTokens(tokens("token-2"));
    await expect(factory()).resolves.toBe("token-2");
  });

  it("refreshes a token that is about to expire before reconnecting", async () => {
    // A room left open past the 15-minute lifetime would otherwise try to
    // reconnect with a dead token and never come back.
    setTokens(tokens("stale", IN_TEN_SECONDS()));
    const refresh = vi
      .spyOn(authApi, "refresh")
      .mockResolvedValue({ tokens: tokens("fresh") });
    createSignalRAuctionHub();

    const factory = connectOptions().accessTokenFactory as TokenFactory;

    await expect(factory()).resolves.toBe("fresh");
    expect(refresh).toHaveBeenCalledWith("refresh-for-stale");
  });

  it("yields an empty token when signed out, so the handshake fails cleanly", async () => {
    clearTokens();
    createSignalRAuctionHub();

    const factory = connectOptions().accessTokenFactory as TokenFactory;
    await expect(factory()).resolves.toBe("");
  });

  it("keeps the transport fallbacks while negotiate is in play", () => {
    createSignalRAuctionHub();

    expect(connectOptions()).not.toHaveProperty("skipNegotiation");
  });
});
