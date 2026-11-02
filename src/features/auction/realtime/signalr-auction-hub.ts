import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

import { freshAccessToken } from "@/features/auth/lib/refresh";
import { HUB_PATH, env } from "@/shared/config/env";

import type { AuctionDetail } from "../model/auction";
import {
  HUB_METHODS,
  type AuctionHub,
  type AuctionHubFactory,
  type HubEventMap,
  type HubEventName,
  type HubIdentity,
} from "./auction-hub";

/**
 * Delay before each reconnect attempt, in milliseconds. SignalR gives up after
 * the last entry; pass a function instead to retry forever.
 */
const RECONNECT_DELAYS_MS = [0, 2_000, 5_000, 10_000, 30_000];

export const createSignalRAuctionHub: AuctionHubFactory = (): AuctionHub => {
  const connection = new HubConnectionBuilder()
    .withUrl(`${env.apiUrl}${HUB_PATH}`, {
      // The hub is [Authorize]d and a browser cannot set headers on the
      // WebSocket handshake, so SignalR carries the token as
      // `?access_token=`. Handing it a factory rather than a string matters:
      // a connection is only authenticated while it is being established, so
      // a reconnect must pick up the *current* token — refreshed first if the
      // old one has run out while the room sat open.
      accessTokenFactory: async () => (await freshAccessToken()) ?? "",
      ...(env.skipNegotiation
        ? // No negotiate step, so it no longer matters which replica answers.
          // The cost is losing the SSE / long-polling fallbacks.
          { skipNegotiation: true, transport: HttpTransportType.WebSockets }
        : null),
    })
    .withAutomaticReconnect([...RECONNECT_DELAYS_MS])
    .configureLogging(
      env.isDevelopment ? LogLevel.Information : LogLevel.Warning,
    )
    .build();

  return {
    start: () => connection.start(),
    stop: () => connection.stop(),

    join: (auctionId) =>
      connection.invoke<AuctionDetail>(HUB_METHODS.joinAuction, auctionId),

    leave: async (auctionId) => {
      await connection.invoke(HUB_METHODS.leaveAuction, auctionId);
    },

    placeBid: async (auctionId, amount) => {
      await connection.invoke(HUB_METHODS.placeBid, auctionId, amount);
    },

    whoAmI: () => connection.invoke<HubIdentity>(HUB_METHODS.whoAmI),

    isConnected: () => connection.state === HubConnectionState.Connected,

    on<K extends HubEventName>(
      event: K,
      handler: (payload: HubEventMap[K]) => void,
    ) {
      // The braces are load-bearing. SignalR logs "Result given for '…' method
      // but server is not expecting a result" when a handler returns a value,
      // which a concise arrow body does for calls like `push` or `add`.
      connection.on(event, (payload: HubEventMap[K]) => {
        handler(payload);
      });
    },

    onReconnecting: (handler) =>
      connection.onreconnecting(() => {
        handler();
      }),

    onReconnected: (handler) =>
      connection.onreconnected(() => {
        handler();
      }),

    onClose: (handler) =>
      connection.onclose(() => {
        handler();
      }),
  };
};
