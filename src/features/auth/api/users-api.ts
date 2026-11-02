import type { HttpClient } from "@/shared/api";

import { apiHttp } from "../lib/api-http";
import type { CurrentUser } from "../model/auth";

export function createUsersApi(http: HttpClient) {
  return {
    /**
     * Identity and permissions of the current session. Reading the token's
     * payload would also work, but this endpoint is the stable contract.
     */
    me: (signal?: AbortSignal) =>
      http.get<CurrentUser>("/api/users/me", { signal }),
  };
}

export type UsersApi = ReturnType<typeof createUsersApi>;

export const usersApi = createUsersApi(apiHttp);
