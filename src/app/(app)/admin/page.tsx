import type { Metadata } from "next";

import { AdminOverview } from "@/features/access-control/components/admin-overview";
import { RequireAuth } from "@/features/auth/components/require-auth";

export const metadata: Metadata = { title: "Yönetim" };

/** Withheld until the session's permissions are known. */
export const instant = false;

export default function AdminHomePage() {
  return (
    <RequireAuth>
      <AdminOverview />
    </RequireAuth>
  );
}
