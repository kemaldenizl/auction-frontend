import type { Metadata } from "next";
import { Suspense } from "react";

import { RequireAuth } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import { catalogApi } from "@/features/catalog/api/catalog-api";
import { ProductForm } from "@/features/catalog/components/product-form";
import { attempt } from "@/shared/api";
import { PageHeader, Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "Yeni ürün" };

/** Gated on `products.manage`, which is only known once the session loads. */
export const instant = false;

/** Categories only feed the input's suggestion list, so a failure is harmless. */
async function NewProductForm() {
  const categories = await attempt(catalogApi.listCategories());

  return <ProductForm categories={categories.ok ? categories.data : []} />;
}

export default function NewProductPage() {
  return (
    <RequireAuth permission={PERMISSION.productsManage}>
      <PageHeader eyebrow="Katalog" title="Yeni ürün" description="Kataloğa yeni bir parça ekleyin." />
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        <NewProductForm />
      </Suspense>
    </RequireAuth>
  );
}
