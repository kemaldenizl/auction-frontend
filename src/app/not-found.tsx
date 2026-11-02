import { Compass } from "lucide-react";
import Link from "next/link";

import { EmptyState, buttonClassName } from "@/shared/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={<Compass />}
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa kaldırılmış ya da adresi değişmiş olabilir."
        action={
          <Link href="/auctions" className={buttonClassName()}>
            Açık artırmalara dön
          </Link>
        }
      />
    </div>
  );
}
