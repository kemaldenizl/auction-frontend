"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGate } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import { errorMessage } from "@/shared/api";
import { Button, ConfirmDialog, buttonClassName, toast } from "@/shared/ui";

import { catalogApi } from "../api/catalog-api";

export function ProductActions({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);

    try {
      await catalogApi.deleteProduct(productId);
      toast("Ürün silindi.");
      router.push("/products");
      // The list is server-rendered; without a refresh the client could show
      // the cached copy that still contains the deleted product.
      router.refresh();
    } catch (cause) {
      toast(errorMessage(cause, "Ürün silinemedi."), "danger");
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <PermissionGate permission={PERMISSION.productsManage}>
      <div className="flex gap-2">
        <Link
          href={`/products/${productId}/edit`}
          className={buttonClassName({ variant: "secondary", size: "sm" })}
        >
          <Pencil /> Düzenle
        </Link>
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          <Trash2 /> Sil
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`“${productName}” silinsin mi?`}
        description="Bu ürün için henüz başlamamış açık artırmalar da iptal edilir. Devam eden ve bitmiş olanlar etkilenmez."
        confirmLabel="Sil"
        destructive
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </PermissionGate>
  );
}
