import { ImageOff } from "lucide-react";
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
        // `group-hover` lets a parent card zoom the image on hover.
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--brand-soft),transparent_70%)] text-subtle">
          <ImageOff aria-label="Görsel yok" className="size-7" />
        </span>
      )}
    </div>
  );
}
