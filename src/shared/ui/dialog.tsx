"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "./button";

/**
 * Wraps the native `<dialog>`, so focus trapping, Escape and the backdrop come
 * from the platform instead of being re-implemented.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Several dialogs can be mounted on one page; each needs its own title id.
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Syncing a DOM element with React state is exactly what an effect is for.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-fg shadow-lift open:animate-scale-in"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
        {footer && <div className="flex justify-end gap-2 pt-2">{footer}</div>}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Vazgeç
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
