import type { ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const directionClass = {
  up: "reveal",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
} as const;

// Deliberately narrow (not React.ElementType): @react-three/fiber extends the
// global JSX.IntrinsicElements with hundreds of three.js element types, which
// makes the broad ElementType collapse polymorphic-tag JSX like `<Tag {...}>`
// to `never` for props (children/ref/style) that aren't common across that
// whole extended union. This component is only ever rendered as one of a
// handful of plain HTML tags, so list them explicitly instead.
type PolymorphicTag = "div" | "li" | "h1" | "h2" | "p" | "span";

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
  as?: PolymorphicTag;
  direction?: keyof typeof directionClass;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <Tag
      // The ref is typed against the common HTMLElement base since Tag is
      // polymorphic (div/li/h1/h2/p/span all have distinct, mutually
      // incompatible ref element types, so no single concrete ref type
      // satisfies all of them at once); see the PolymorphicTag comment
      // above for why this can't just be React.ElementType instead.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(directionClass[direction], shown && "reveal-in", className)}
    >
      {children}
    </Tag>
  );
}
