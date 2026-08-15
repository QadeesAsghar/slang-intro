import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-[0.18em] text-violet uppercase">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold text-balance sm:text-4xl">{title}</h2>
      {children ? (
        <p className="mt-4 text-base text-pretty text-muted-foreground">{children}</p>
      ) : null}
    </Reveal>
  );
}
