import { useEffect, useRef } from "react";

const EASE = "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
const MAX_PULL = 10;

/**
 * Small magnetic pull toward the cursor for a single CTA-sized element.
 * Listeners are only attached to the element itself (not window), so it's
 * inert everywhere else on the page. No-ops on touch/coarse pointers and
 * under prefers-reduced-motion.
 */
export function useMagnetic<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;

    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = node!.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        node!.style.transition = "none";
        node!.style.transform = `translate(${relX * MAX_PULL}px, ${relY * MAX_PULL}px)`;
      });
    }

    function onLeave() {
      cancelAnimationFrame(raf);
      node!.style.transition = EASE;
      node!.style.transform = "";
    }

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      node.style.transition = "";
      node.style.transform = "";
    };
  }, [enabled]);

  return ref;
}
