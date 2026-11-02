import { createHttpClient } from "@/shared/api";
import { env } from "@/shared/config/env";

import { getAccessToken } from "../model/token-store";
import { refreshSession } from "./refresh";

/**
 * The client every feature uses for data.
 *
 * It attaches the bearer token when there is one and, on a 401, refreshes once
 * through the shared queue and replays the request. Public reads work through
 * it unchanged: with no token it simply sends no header.
 *
 * The identity endpoints do **not** use this client — see `authHttp`.
 */
export const apiHttp = createHttpClient(env.apiUrl, {
  getAccessToken,
  onUnauthorized: async () => (await refreshSession()) !== null,
});
