import { ArrowRight, CalendarClock, Flame, ShieldCheck, Timer, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import {
  AuctionBoard,
  AuctionBoardSkeleton,
} from "@/features/auction/components/auction-board";
import { buttonClassName, stagger } from "@/shared/ui";

const FEATURES = [
  { Icon: Zap, title: "Anında güncellenir", text: "Yeni teklifler sayfayı yenilemeden ekrana düşer." },
  { Icon: Timer, title: "Saniyesi saniyesine", text: "Geri sayım herkes için aynı saati gösterir." },
  { Icon: ShieldCheck, title: "Güvenli hesap", text: "İki adımlı doğrulama ile hesabınızı koruyun." },
];

function SectionTitle({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand [&_svg]:size-4">
          {icon}
        </span>
        {title}
      </h2>
      {action}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section className="relative pt-6 pb-4 text-center sm:pt-12">
        <p className="mx-auto inline-flex animate-fade-up items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-70" />
            <span className="relative size-2 rounded-full bg-live" />
          </span>
          Gerçek zamanlı açık artırma
        </p>

        <h1
          className="mx-auto mt-6 max-w-3xl animate-fade-up text-4xl leading-[1.08] font-semibold tracking-tight text-fg stagger sm:text-6xl"
          style={stagger(1, 90)}
        >
          Nadir parçalar,{" "}
          <span className="text-gradient animate-gradient-pan">canlı teklifler.</span>
        </h1>

        <p
          className="mx-auto mt-5 max-w-xl animate-fade-up text-base text-muted stagger sm:text-lg"
          style={stagger(2, 90)}
        >
          Koleksiyonluk saatlerden ilk baskı kitaplara kadar her ürün için
          teklifinizi verin, fiyatın değiştiğini anında görün.
        </p>

        <div
          className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 stagger"
          style={stagger(3, 90)}
        >
          <Link href="/auctions?status=Live" className={buttonClassName({ size: "lg" })}>
            Canlı açık artırmalar <ArrowRight />
          </Link>
          <Link href="/products" className={buttonClassName({ variant: "secondary", size: "lg" })}>
            Ürünleri keşfet
          </Link>
        </div>

        <ul className="mx-auto mt-14 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }, index) => (
            <li
              key={title}
              className="glass animate-fade-up rounded-card border border-line p-5 stagger"
              style={stagger(index + 4, 90)}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-white shadow-[0_6px_16px_-6px] shadow-brand/60">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 font-semibold text-fg">{title}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle
          icon={<Flame />}
          title="Şu an canlı"
          action={
            <Link
              href="/auctions?status=Live"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Tümü <ArrowRight className="size-4" />
            </Link>
          }
        />
        {/* Uncached reads stream in behind their own boundary, so the hero
            paints immediately. */}
        <Suspense fallback={<AuctionBoardSkeleton count={3} />}>
          <AuctionBoard
            status="Live"
            pageSize={6}
            paginated={false}
            emptyTitle="Şu an canlı açık artırma yok"
            emptyDescription="Yakında başlayacak olanlara göz atın."
          />
        </Suspense>
      </section>

      {/* A secondary section: it disappears entirely when nothing is planned. */}
      <Suspense fallback={null}>
        <section>
          <AuctionBoard
            status="Scheduled"
            pageSize={3}
            paginated={false}
            hideWhenEmpty
            heading={
              <SectionTitle icon={<CalendarClock />} title="Yakında başlayacak" />
            }
          />
        </section>
      </Suspense>
    </div>
  );
}
