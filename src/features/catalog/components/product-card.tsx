import Link from "next/link";

import { formatMoney } from "@/shared/lib/format";
import { Badge, Thumbnail } from "@/shared/ui";

import type { Product } from "../model/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-line-strong"
    >
      <Thumbnail src={product.imageUrl} alt={product.name} />

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-fg">
            {product.name}
          </h3>
          {!product.isActive && <Badge tone="neutral">Pasif</Badge>}
        </div>

        <p className="text-xs text-subtle">{product.category}</p>

        <p className="text-sm font-semibold tabular text-fg">
          {formatMoney(product.startingPrice)}
          <span className="ml-1 text-xs font-normal text-subtle">
            başlangıç
          </span>
        </p>
      </div>
    </Link>
  );
}
