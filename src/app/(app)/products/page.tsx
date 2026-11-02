import { Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PermissionGate } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import {
  ProductCatalog,
  ProductCatalogSkeleton,
} from "@/features/catalog/components/product-catalog";
import { isProductSortBy } from "@/features/catalog/model/product";
import {
  readBoolean,
  readPage,
  readString,
} from "@/shared/lib/search-params";
import { PageHeader, buttonClassName } from "@/shared/ui";

export const metadata: Metadata = { title: "Ürünler" };

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        title="Ürünler"
        eyebrow="Katalog"
        description="Koleksiyonluk parçaları keşfedin, açık artırmalarını takip edin."
        action={
          <PermissionGate permission={PERMISSION.productsManage}>
            <Link href="/products/new" className={buttonClassName()}>
              <Plus /> Yeni ürün
            </Link>
          </PermissionGate>
        }
      />

      <Suspense fallback={<ProductCatalogSkeleton />}>
        {props.searchParams.then((searchParams) => {
          const rawSort = readString(searchParams.sortBy);

          return (
            <ProductCatalog
              filters={{
                search: readString(searchParams.search),
                category: readString(searchParams.category),
                sortBy:
                  rawSort && isProductSortBy(rawSort) ? rawSort : undefined,
                descending: readBoolean(searchParams.descending),
                isActive: readBoolean(searchParams.isActive),
              }}
              page={readPage(searchParams.page)}
            />
          );
        })}
      </Suspense>
    </>
  );
}
