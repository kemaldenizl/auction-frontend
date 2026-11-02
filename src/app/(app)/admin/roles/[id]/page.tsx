import type { Metadata } from "next";
import { Suspense } from "react";

import { RoleDetailPanel } from "@/features/access-control/components/role-detail-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import { Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "Rol" };

/** Withheld until the session's permissions are known. */
export const instant = false;

export default function AdminRoleDetailPage(
  props: PageProps<"/admin/roles/[id]">,
) {
  return (
    <RequireAuth permission={PERMISSION.rolesRead}>
      <Suspense fallback={<Skeleton className="h-96" />}>
        {props.params.then(({ id }) => (
          <RoleDetailPanel roleId={id} />
        ))}
      </Suspense>
    </RequireAuth>
  );
}
