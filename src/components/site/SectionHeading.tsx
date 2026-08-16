import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";

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
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <Reveal>
        <p className="text-[11px] font-medium tracking-[0.18em] text-violet uppercase">{eyebrow}</p>
      </Reveal>
      <RevealText
        as="h2"
        text={title}
        className="mt-4 block text-3xl font-semibold text-balance sm:text-4xl"
        delay={80}
        stagger={35}
      />
      {children ? (
        <Reveal delay={220}>
          <p className="mt-4 text-base text-pretty text-muted-foreground">{children}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
