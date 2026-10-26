import Image from "next/image";

import { cn } from "@/shared/lib/cn";

export function Thumbnail({
  src,
  alt,
  ratio = "aspect-[4/3]",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
}: {
  src: string | null;
  alt: string;
  ratio?: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-muted",
        ratio,
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs text-subtle">
          Görsel yok
        </span>
      )}
    </div>
  );
}
