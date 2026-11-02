"use client";

import { Check, PackagePlus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Textarea,
  toast,
} from "@/shared/ui";

import { catalogApi } from "../api/catalog-api";
import type { Product, ProductDraft } from "../model/product";

interface Draft {
  name: string;
  description: string;
  category: string;
  startingPrice: string;
  imageUrl: string;
  isActive: boolean;
}

function toDraft(product: Product | null): Draft {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    startingPrice: product ? String(product.startingPrice) : "",
    imageUrl: product?.imageUrl ?? "",
    isActive: product?.isActive ?? true,
  };
}

/**
 * Create and edit share one form because the bodies are the same shape; only
 * `PUT` adds `isActive`, and because `PUT` replaces the record outright every
 * field is submitted, not just the changed ones.
 */
export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: string[];
}) {
  const router = useRouter();
  const form = useFormSubmit();
  const [draft, setDraft] = useState<Draft>(() => toDraft(product ?? null));
  const [localError, setLocalError] = useState<string | null>(null);

  const editing = product !== undefined;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const save = form.submit(async () => {
    const price = Number(draft.startingPrice);
    if (!(price > 0)) {
      setLocalError("Başlangıç fiyatı sıfırdan büyük olmalı.");
      return;
    }
    if (draft.name.trim().length < 3) {
      setLocalError("Ad en az 3 karakter olmalı.");
      return;
    }
    setLocalError(null);

    const body: ProductDraft = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      category: draft.category.trim(),
      startingPrice: price,
      imageUrl: draft.imageUrl.trim() || null,
    };

    const saved = editing
      ? await catalogApi.updateProduct(product.id, {
          ...body,
          isActive: draft.isActive,
        })
      : await catalogApi.createProduct(body);

    toast(editing ? "Ürün güncellendi." : "Ürün oluşturuldu.");
    router.push(`/products/${saved.id}`);
    // Server-rendered pages (the list, the detail) must not show a stale copy.
    router.refresh();
  });

  return (
    <Card className="animate-fade-up">
      <CardHeader
        icon={editing ? <Pencil /> : <PackagePlus />}
        title={editing ? "Ürün bilgileri" : "Yeni ürün"}
        description={
          editing
            ? "Değişiklikler henüz başlamamış açık artırmalara da yansır."
            : "Ürün adı benzersiz olmalı."
        }
      />
      <CardBody>
        <form onSubmit={save} className="space-y-4">
          {(localError ?? form.error) && (
            <Alert role="alert" tone="danger">
              {localError ?? form.error}
            </Alert>
          )}

          <Field id="product-name" label="Ad" error={form.fieldErrors.name}>
            <Input
              id="product-name"
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              minLength={3}
              maxLength={200}
              required
            />
          </Field>

          <Field
            id="product-description"
            label="Açıklama"
            error={form.fieldErrors.description}
          >
            <Textarea
              id="product-description"
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="product-category"
              label="Kategori"
              error={form.fieldErrors.category}
            >
              <Input
                id="product-category"
                value={draft.category}
                onChange={(event) => update("category", event.target.value)}
                list="product-categories"
                required
              />
              <datalist id="product-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>

            <Field
              id="product-price"
              label="Başlangıç fiyatı"
              error={form.fieldErrors.startingprice}
            >
              <Input
                id="product-price"
                type="number"
                min={1}
                step="0.01"
                value={draft.startingPrice}
                onChange={(event) =>
                  update("startingPrice", event.target.value)
                }
                required
                className="tabular"
              />
            </Field>
          </div>

          <Field
            id="product-image"
            label="Görsel bağlantısı"
            hint="İsteğe bağlı. https:// ile başlayan bir görsel adresi."
            error={form.fieldErrors.imageurl}
          >
            <Input
              id="product-image"
              type="url"
              value={draft.imageUrl}
              onChange={(event) => update("imageUrl", event.target.value)}
              placeholder="https://example.com/urun.png"
            />
          </Field>

          {editing && (
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-surface-muted/50 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-fg">Satışta</span>
                <span className="block text-xs text-subtle">
                  Satışta olmayan ürün için açık artırma açılamaz.
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={draft.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors duration-300 peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-spring peer-checked:after:translate-x-5"
              />
            </label>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={form.pending}>
              {!form.pending && <Check />}
              {editing ? "Değişiklikleri kaydet" : "Ürünü oluştur"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Vazgeç
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
