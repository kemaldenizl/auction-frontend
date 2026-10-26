/**
 * Runtime configuration.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so they have to be read
 * through a literal `process.env.NEXT_PUBLIC_X` expression — a computed lookup
 * would not survive the bundler.
 */

const DEFAULT_API_URL = "http://localhost:5080";

function readBoolean(raw: string | undefined, fallback = false): boolean {
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

/**
 * A single address is enough: the gateway in front of the services routes
 * `/api/products` to the catalog service and `/api/auctions` + `/hubs/auction`
 * to the auction service. Never point the frontend at a service port directly.
 */
export const env = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(
    /\/+$/,
    "",
  ),
  /**
   * With more than one auction service replica, SignalR's `negotiate` call and
   * the WebSocket upgrade can land on different instances. Skipping negotiate
   * removes the problem at the cost of the SSE / long-polling fallbacks.
   */
  skipNegotiation: readBoolean(
    process.env.NEXT_PUBLIC_SIGNALR_SKIP_NEGOTIATION,
  ),
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

export const HUB_PATH = "/hubs/auction";
