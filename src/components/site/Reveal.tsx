import type { ReactNode, ElementType } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const directionClass = {
  up: "reveal",
  left: "reveal-left",
  right: "reveal-right",
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  direction?: keyof typeof directionClass;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(directionClass[direction], shown && "reveal-in", className)}
    >
      {children}
    </Tag>
  );
}
