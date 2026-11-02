import { ArrowLeft, CalendarDays, Gavel, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  AuctionBoard,
  AuctionBoardSkeleton,
} from "@/features/auction/components/auction-board";
import { CreateAuctionForm } from "@/features/auction/components/create-auction-form";
import { attempt } from "@/shared/api";
import { formatDateTime, formatMoney } from "@/shared/lib/format";
import {
  ApiErrorPanel,
  Badge,
  Skeleton,
  Stat,
  Thumbnail,
  stagger,
} from "@/shared/ui";

import { catalogApi } from "../api/catalog-api";
import { ProductActions } from "./product-actions";

export async function ProductDetail({ productId }: { productId: string }) {
  const result = await attempt(catalogApi.getProduct(productId));

  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    return <ApiErrorPanel problem={result.error.problem} />;
  }

  const product = result.data;

  return (
    <div className="space-y-14">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Tüm ürünler
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="animate-fade-up overflow-hidden rounded-card border border-line shadow-card lg:sticky lg:top-24">
          <Thumbnail
            src={product.imageUrl}
            alt={product.name}
            ratio="aspect-square"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>

        <div className="space-y-8">
          <div
            className="flex animate-fade-up flex-wrap items-start justify-between gap-4 stagger"
            style={stagger(1, 90)}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">
                  <Tag /> {product.category}
                </Badge>
                {!product.isActive && <Badge tone="neutral">Satışta değil</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {product.name}
              </h1>
              {product.description && (
                <p className="mt-3 text-muted">{product.description}</p>
              )}
            </div>
            <ProductActions productId={product.id} productName={product.name} />
          </div>

          <dl
            className="grid animate-fade-up grid-cols-2 gap-4 rounded-card border border-line bg-surface p-5 shadow-card stagger"
            style={stagger(2, 90)}
          >
            <Stat
              icon={<Gavel />}
              label="Başlangıç fiyatı"
              value={
                <span className="text-gradient">
                  {formatMoney(product.startingPrice)}
                </span>
              }
            />
            <Stat
              icon={<CalendarDays />}
              label="Eklenme"
              value={formatDateTime(product.createdAt)}
            />
          </dl>

          <div className="animate-fade-up stagger" style={stagger(3, 90)}>
            <CreateAuctionForm
              productId={product.id}
              startingPrice={product.startingPrice}
            />
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-fg">
          Bu ürünün açık artırmaları
        </h2>
        <Suspense fallback={<AuctionBoardSkeleton count={3} />}>
          <AuctionBoard
            productId={product.id}
            pageSize={6}
            paginated={false}
            emptyTitle="Bu ürün için henüz açık artırma yok"
            emptyDescription="Açık artırma başladığında burada görünecek."
          />
        </Suspense>
      </section>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <Skeleton className="aspect-square rounded-card" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20" />
        <Skeleton className="h-48 rounded-card" />
      </div>
    </div>
  );
}
