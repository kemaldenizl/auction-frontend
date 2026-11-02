import type { Metadata } from "next";

import { RolesPanel } from "@/features/access-control/components/roles-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";

export const metadata: Metadata = { title: "Roller" };

/** Withheld until the session's permissions are known. */
export const instant = false;

export default function AdminRolesPage() {
  return (
    <RequireAuth permission={PERMISSION.rolesRead}>
      <RolesPanel />
    </RequireAuth>
  );
}
