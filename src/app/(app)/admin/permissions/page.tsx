import type { Metadata } from "next";

import { PermissionsPanel } from "@/features/access-control/components/permissions-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";

export const metadata: Metadata = { title: "İzinler" };

/** Withheld until the session's permissions are known. */
export const instant = false;

export default function AdminPermissionsPage() {
  return (
    <RequireAuth permission={PERMISSION.permissionsRead}>
      <PermissionsPanel />
    </RequireAuth>
  );
}
