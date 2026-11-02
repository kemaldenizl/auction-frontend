import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { readString } from "@/shared/lib/search-params";
import { Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "Parola sıfırlama" };

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-sm" />}>
      {props.searchParams.then((searchParams) => (
        <ResetPasswordForm token={readString(searchParams.token) ?? null} />
      ))}
    </Suspense>
  );
}
