import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";
import { readInternalPath } from "@/shared/lib/search-params";
import { Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "Giriş" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-sm" />}>
      {props.searchParams.then((searchParams) => (
        <LoginForm next={readInternalPath(searchParams.next)} />
      ))}
    </Suspense>
  );
}
