"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button, EmptyState, buttonClassName } from "@/shared/ui";

/**
 * Last-resort boundary. Expected API failures are rendered inline, so anything
 * reaching here is unexpected — the details go to the console, not the user.
 */
export default function RouteError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={<TriangleAlert />}
        title="Bir şeyler ters gitti"
        description="Bu sayfa yüklenirken beklenmeyen bir sorun oluştu. Tekrar deneyebilir ya da ana sayfaya dönebilirsiniz."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>
              <RotateCcw /> Tekrar dene
            </Button>
            <Link href="/" className={buttonClassName({ variant: "secondary" })}>
              Ana sayfa
            </Link>
          </div>
        }
      />
    </div>
  );
}
