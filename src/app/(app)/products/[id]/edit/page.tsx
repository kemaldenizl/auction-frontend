import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RequireAuth } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import { catalogApi } from "@/features/catalog/api/catalog-api";
import { ProductForm } from "@/features/catalog/components/product-form";
import { attempt } from "@/shared/api";
import { ApiErrorPanel, PageHeader, Skeleton } from "@/shared/ui";

export const metadata: Metadata = { title: "Ürünü düzenle" };

/** Gated on `products.manage`, which is only known once the session loads. */
export const instant = false;

async function EditProductForm({ productId }: { productId: string }) {
  const [product, categories] = await Promise.all([
    attempt(catalogApi.getProduct(productId)),
    attempt(catalogApi.listCategories()),
  ]);

  if (!product.ok) {
    if (product.error.isNotFound) notFound();
    return <ApiErrorPanel problem={product.error.problem} />;
  }

  return (
    <ProductForm
      product={product.data}
      categories={categories.ok ? categories.data : []}
    />
  );
}

export default function EditProductPage(
  props: PageProps<"/products/[id]/edit">,
) {
  return (
    <RequireAuth permission={PERMISSION.productsManage}>
      <PageHeader
        title="Ürünü düzenle"
        eyebrow="Katalog"
        description="Ürün bilgilerini güncelleyin."
      />
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        {props.params.then(({ id }) => (
          <EditProductForm productId={id} />
        ))}
      </Suspense>
    </RequireAuth>
  );
}
