import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";
import { readString } from "@/shared/lib/search-params";
import { Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "E-posta doğrulama" };

export default function VerifyEmailPage(props: PageProps<"/verify-email">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-sm" />}>
      {props.searchParams.then((searchParams) => (
        <VerifyEmailPanel token={readString(searchParams.token) ?? null} />
      ))}
    </Suspense>
  );
}
