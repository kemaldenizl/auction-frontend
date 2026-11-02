import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "@/features/auth/components/register-form";
import { readInternalPath } from "@/shared/lib/search-params";
import { Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "Kayıt" };

export default function RegisterPage(props: PageProps<"/register">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-sm" />}>
      {props.searchParams.then((searchParams) => (
        <RegisterForm next={readInternalPath(searchParams.next)} />
      ))}
    </Suspense>
  );
}
