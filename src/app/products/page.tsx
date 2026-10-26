import type { Metadata } from "next";
import { Suspense } from "react";

import {
  ProductCatalog,
  ProductCatalogSkeleton,
} from "@/features/catalog/components/product-catalog";
import { readPage, readString } from "@/shared/lib/search-params";
import { PageHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "Ürünler" };

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        title="Ürünler"
        description="Katalog servisi. Bir ürünü açıp onun için açık arttırma başlatabilirsiniz."
      />

      <Suspense fallback={<ProductCatalogSkeleton />}>
        {props.searchParams.then((searchParams) => (
          <ProductCatalog
            category={readString(searchParams.category)}
            page={readPage(searchParams.page)}
          />
        ))}
      </Suspense>
    </>
  );
}
