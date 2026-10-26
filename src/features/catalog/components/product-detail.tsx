import { notFound } from "next/navigation";

import { CreateAuctionForm } from "@/features/auction/components/create-auction-form";
import { attempt } from "@/shared/api";
import { formatDateTime, formatMoney } from "@/shared/lib/format";
import {
  ApiErrorPanel,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Skeleton,
  Stat,
  Thumbnail,
} from "@/shared/ui";

import { catalogApi } from "../api/catalog-api";

export async function ProductDetail({ productId }: { productId: string }) {
  const result = await attempt(catalogApi.getProduct(productId));

  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    return <ApiErrorPanel problem={result.error.problem} />;
  }

  const product = result.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Thumbnail
        src={product.imageUrl}
        alt={product.name}
        ratio="aspect-square"
        sizes="(max-width: 1024px) 100vw, 40vw"
        className="rounded-card border border-line"
      />

      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.category}</Badge>
            {!product.isActive && <Badge tone="neutral">Pasif</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-2 text-sm text-muted">{product.description}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <Stat
            label="Başlangıç fiyatı"
            value={formatMoney(product.startingPrice)}
          />
          <Stat label="Eklendi" value={formatDateTime(product.createdAt)} />
        </dl>

        <Card>
          <CardHeader
            title="Bu ürün için açık arttırma aç"
            description="Oluşturulduktan sonra odaya yönlendirilirsiniz."
          />
          <CardBody>
            <CreateAuctionForm
              productId={product.id}
              startingPrice={product.startingPrice}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Skeleton className="aspect-square" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-16" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
