import { useEffect, useRef } from "react";

const EASE = "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)";
const MAX_TILT = 5;
const LIFT_PX = 8;

/**
 * Subtle cursor-based 3D tilt + elevation for an element: the product frame
 * "reacts slightly when the cursor approaches it" behavior. Element-scoped
 * listeners only (attached directly to the node, not window), so it costs
 * nothing anywhere else on the page. No-ops on touch/coarse pointers and
 * under prefers-reduced-motion, in which case the element keeps whatever
 * static hover styles it already has from its className.
 */
export function useTilt<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;

    function apply(rotateX: number, rotateY: number, lift: number) {
      node!.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${lift}px)`;
    }

    function onEnter() {
      node!.style.transition = EASE;
      apply(0, 0, -LIFT_PX);
    }

    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = node!.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        node!.style.transition = "none";
        apply((0.5 - py) * MAX_TILT, (px - 0.5) * MAX_TILT, -LIFT_PX);
      });
    }

    function onLeave() {
      cancelAnimationFrame(raf);
      node!.style.transition = EASE;
      node!.style.transform = "";
    }

    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mouseenter", onEnter);
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      node.style.transition = "";
      node.style.transform = "";
    };
  }, [enabled]);

  return ref;
}
