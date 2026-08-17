import { Fragment } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

// See the matching comment in Reveal.tsx: kept narrow rather than
// React.ElementType because @react-three/fiber's global JSX.IntrinsicElements
// extension breaks polymorphic-tag JSX typing for the broad type.
type PolymorphicTag = "div" | "h1" | "h2" | "p" | "span";

/**
 * Word-by-word reveal, built on the same one-shot useReveal/IntersectionObserver
 * the rest of the site's scroll reveals use: one observer per block, words
 * staggered purely via CSS transition-delay (same technique Reveal/SectionHeading
 * already use for staggered children). Each word sits in its own clipped
 * "mask" so it rises into place instead of just fading; the space between
 * words is a plain text node outside the mask so normal line-wrapping still
 * works at any viewport width.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className,
  wordClassName,
  delay = 0,
  stagger = 45,
}: {
  text: string;
  as?: PolymorphicTag;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  const words = text.split(" ");

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="word-mask">
            <span
              className={cn("word-rise", shown && "word-rise-in", wordClassName)}
              style={{ transitionDelay: `${delay + i * stagger}ms` }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
