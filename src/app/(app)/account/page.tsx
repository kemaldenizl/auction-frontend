import type { Metadata } from "next";

import { ProfilePanel } from "@/features/account/components/profile-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";

export const metadata: Metadata = { title: "Profil" };

/**
 * Navigating here legitimately blocks: the panel cannot render until the
 * browser has read the session out of storage and asked `/api/users/me` what
 * it may do. The chrome around it still paints immediately.
 */
export const instant = false;

export default function AccountPage() {
  return (
    <RequireAuth>
      <ProfilePanel />
    </RequireAuth>
  );
}
