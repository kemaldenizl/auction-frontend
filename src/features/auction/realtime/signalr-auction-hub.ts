import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

import type { Bidder } from "@/features/bidder/model/bidder";
import { toQueryString } from "@/shared/api";
import { HUB_PATH, env } from "@/shared/config/env";

import type { AuctionDetail } from "../model/auction";
import {
  HUB_METHODS,
  type AuctionHub,
  type AuctionHubFactory,
  type HubEventMap,
  type HubEventName,
} from "./auction-hub";

/**
 * Delay before each reconnect attempt, in milliseconds. SignalR gives up after
 * the last entry; pass a function instead to retry forever.
 */
const RECONNECT_DELAYS_MS = [0, 2_000, 5_000, 10_000, 30_000];

export function buildHubUrl(baseUrl: string, bidder: Bidder): string {
  // With JWT auth these query parameters disappear and an
  // `accessTokenFactory` takes their place — the event contract is unchanged.
  return `${baseUrl}${HUB_PATH}${toQueryString({
    bidderId: bidder.id,
    bidderName: bidder.name,
  })}`;
}

export const createSignalRAuctionHub: AuctionHubFactory = (
  bidder: Bidder,
): AuctionHub => {
  const connection = new HubConnectionBuilder()
    .withUrl(
      buildHubUrl(env.apiUrl, bidder),
      env.skipNegotiation
        ? // No negotiate step, so it no longer matters which replica answers.
          // The cost is losing the SSE / long-polling fallbacks.
          { skipNegotiation: true, transport: HttpTransportType.WebSockets }
        : {},
    )
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

    placeBid: async (auctionId, amount) => {
      await connection.invoke(HUB_METHODS.placeBid, auctionId, amount);
    },

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
