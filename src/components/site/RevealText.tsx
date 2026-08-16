import { Fragment, type ElementType } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Word-by-word reveal, built on the same one-shot useReveal/IntersectionObserver
 * the rest of the site's scroll reveals use — one observer per block, words
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
  as?: ElementType;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const words = text.split(" ");

  return (
    <Tag ref={ref} className={className}>
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
