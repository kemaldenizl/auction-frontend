import type { Metadata } from "next";

import { ChangeEmailForm } from "@/features/account/components/change-email-form";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { MfaPanel } from "@/features/account/components/mfa-panel";
import { RequireAuth } from "@/features/auth/components/require-auth";

export const metadata: Metadata = { title: "Güvenlik" };

/** Withheld until the session is known — see `/account`. */
export const instant = false;

export default function AccountSecurityPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <ChangePasswordForm />
        <ChangeEmailForm />
        <MfaPanel />
      </div>
    </RequireAuth>
  );
}
