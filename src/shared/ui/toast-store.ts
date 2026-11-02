export type ToastTone = "success" | "danger" | "info";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DISMISS_AFTER_MS = 4_000;

/** Stable empty reference: `useSyncExternalStore` compares snapshots by identity. */
const EMPTY: Toast[] = [];

let toasts: Toast[] = EMPTY;
let nextId = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastsSnapshot(): Toast[] {
  return toasts;
}

/** Nothing has happened yet on the server. */
export function getToastsServerSnapshot(): Toast[] {
  return EMPTY;
}

export function dismissToast(id: number): void {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) return;

  toasts = next;
  emit();
}

/** Brief confirmation of something that already happened. */
export function toast(message: string, tone: ToastTone = "success"): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }];
  emit();

  setTimeout(() => dismissToast(id), DISMISS_AFTER_MS);
}

/** Test seam. */
export function resetToasts(): void {
  toasts = EMPTY;
  listeners.clear();
}
