import type { Metadata } from "next";

import { SessionsPanel } from "@/features/account/components/sessions-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";

export const metadata: Metadata = { title: "Oturumlar" };

/** Withheld until the session is known — see `/account`. */
export const instant = false;

export default function AccountSessionsPage() {
  return (
    <RequireAuth>
      <SessionsPanel />
    </RequireAuth>
  );
}
