import type { Metadata } from "next";

import { UserRolesPanel } from "@/features/access-control/components/user-roles-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";

export const metadata: Metadata = { title: "Kullanıcı rolleri" };

/** Withheld until the session's permissions are known. */
export const instant = false;

export default function AdminUsersPage() {
  return (
    <RequireAuth>
      <UserRolesPanel />
    </RequireAuth>
  );
}
