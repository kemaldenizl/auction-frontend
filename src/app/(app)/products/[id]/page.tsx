import type { Metadata } from "next";
import { Suspense } from "react";

import {
  ProductDetail,
  ProductDetailSkeleton,
} from "@/features/catalog/components/product-detail";

export const metadata: Metadata = { title: "Ürün" };

export default function ProductPage(props: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      {props.params.then(({ id }) => (
        <ProductDetail productId={id} />
      ))}
    </Suspense>
  );
}
