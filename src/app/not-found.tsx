import Link from "next/link";

import { EmptyState } from "@/shared/ui";

export default function NotFound() {
  return (
    <EmptyState
      title="Sayfa bulunamadı"
      description="Aradığınız kayıt silinmiş ya da adres hatalı olabilir."
      action={
        <Link
          href="/auctions"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg"
        >
          Açık arttırmalara dön
        </Link>
      }
    />
  );
}
