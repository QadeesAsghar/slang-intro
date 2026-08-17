import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/hooks/use-tilt";

export function ProductFrame({
  src,
  alt,
  label = "slang.app",
  priority = false,
  className,
  imageClassName,
  chrome = true,
  children,
  interactive = false,
}: {
  src?: string;
  alt?: string;
  label?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  chrome?: boolean;
  children?: ReactNode;
  /** Subtle cursor tilt + elevation, so the interface feels like a living object. */
  interactive?: boolean;
}) {
  const tiltRef = useTilt<HTMLElement>(interactive);
  return (
    <figure
      ref={interactive ? tiltRef : undefined}
      className={cn(
        "depth overflow-hidden rounded-xl border border-hairline bg-surface",
        interactive && "will-change-transform",
        className,
      )}
    >
      {chrome ? (
        <div className="flex items-center gap-3 border-b border-hairline bg-surface-2/70 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="mx-auto rounded-md bg-background/60 px-3 py-1 text-[11px] tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
      ) : null}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : undefined}
          className={cn("block w-full", imageClassName)}
        />
      ) : (
        children
      )}
    </figure>
  );
}

export function CropFrame({
  src,
  alt,
  className,
  imageClassName,
  height = "h-[280px] sm:h-[360px] lg:h-[440px]",
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "depth overflow-hidden rounded-xl border border-hairline bg-surface",
        height,
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("size-full object-cover object-left-top", imageClassName)}
      />
    </div>
  );
}

export function ZoomCrop({
  src,
  alt,
  zoom = 200,
  x = 0,
  y = 0,
  height = "h-[240px]",
  className,
  label,
}: {
  src: string;
  alt: string;
  /** Image width as a percentage of the frame width. */
  zoom?: number;
  /** Horizontal focus, 0 = left edge, 100 = right edge. */
  x?: number;
  /** Vertical focus, 0 = top edge, 100 = bottom edge. */
  y?: number;
  height?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "depth relative overflow-hidden rounded-xl border border-hairline bg-surface",
        height,
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute max-w-none"
        style={{
          width: `${zoom}%`,
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(${-x}%, ${-y}%)`,
        }}
      />
      {label ? (
        <span className="absolute bottom-3 left-3 rounded-md border border-hairline bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
          {label}
        </span>
      ) : null}
    </div>
  );
}
