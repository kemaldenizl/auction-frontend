import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { formatMoney } from "@/shared/lib/format";
import { Badge, Thumbnail } from "@/shared/ui";

import type { Product } from "../model/product";

export function ProductCard({
  product,
  style,
}: {
  product: Product;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={`/products/${product.id}`}
      style={style}
      className="group block animate-fade-up overflow-hidden rounded-card border border-line bg-surface shadow-card stagger transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-lift"
    >
      <div className="relative">
        <Thumbnail src={product.imageUrl} alt={product.name} />
        <Badge tone="brand" className="absolute top-3 left-3 shadow-card">
          {product.category}
        </Badge>
        {!product.isActive && (
          <Badge tone="neutral" className="absolute top-3 right-3">
            Satışta değil
          </Badge>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-semibold text-fg">{product.name}</h3>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold tabular text-fg">
              {formatMoney(product.startingPrice)}
            </span>{" "}
            başlangıç
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-subtle transition-all duration-300 group-hover:rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-brand-fg">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
