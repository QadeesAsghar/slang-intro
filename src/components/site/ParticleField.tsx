import { useEffect, useRef } from "react";

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  orbitPhase: number;
  orbitSpeed: number;
  orbitRadius: number;
  radius: number;
  colorIndex: 0 | 1;
}

const MAX_PARTICLES = 70;
const AREA_PER_PARTICLE = 16000; // px^2 per particle, keeps density sane on large screens
const CURSOR_RADIUS = 140;
const CURSOR_FORCE = 34;
const RETURN_EASE = 0.045;
const GLOW_BLUR = 7;

/**
 * A sparse field of soft points behind the whole page. Each point continuously
 * orbits its own home position (never reverses direction, unlike a back-and-
 * forth oscillation) so the field always reads as gently in motion. On
 * pointer-fine devices, points near the cursor also ease away and rejoin
 * their orbit once it moves off. Fully skipped under prefers-reduced-motion and
 * paused while the tab is hidden. Reads --violet/--blue/--particle-alpha off
 * the document so it stays correct across the default/light theme toggle
 * without any of its own color logic — visibility is controlled once, via
 * the per-particle fill alpha, not compounded with a canvas-level opacity.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let raf = 0;
    let running = true;
    const fallbackColors: [string, string] = ["132 121 255", "96 165 250"];
    let colors: [string, string] = fallbackColors;
    let alpha = 0.55;

    function readTheme() {
      const style = getComputedStyle(document.documentElement);
      colors = [
        toRgbTriplet(style.getPropertyValue("--violet")) ?? fallbackColors[0],
        toRgbTriplet(style.getPropertyValue("--blue")) ?? fallbackColors[1],
      ];
      const parsedAlpha = parseFloat(style.getPropertyValue("--particle-alpha"));
      alpha = Number.isFinite(parsedAlpha) ? parsedAlpha : alpha;
    }

    // oklch() can't be fed straight into canvas fillStyle reliably across
    // browsers, so borrow the browser's own color parser via a throwaway
    // element instead of hand-rolling oklch math.
    function toRgbTriplet(oklch: string): string | null {
      const probe = document.createElement("span");
      probe.style.color = oklch.trim();
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      document.body.removeChild(probe);
      const match = rgb.match(/\d+/g);
      return match ? `${match[0]} ${match[1]} ${match[2]}` : null;
    }

    function seed() {
      const count = Math.min(MAX_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE));
      particles = Array.from({ length: count }, () => {
        const homeX = Math.random() * width;
        const homeY = Math.random() * height;
        return {
          homeX,
          homeY,
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
          orbitPhase: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() * 0.16 + 0.08) * (Math.random() < 0.5 ? 1 : -1),
          orbitRadius: Math.random() * 50 + 40,
          radius: Math.random() * 1.3 + 1.1,
          colorIndex: Math.random() < 0.5 ? 0 : 1,
        };
      });
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function onPointerMove(e: PointerEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function onPointerLeave() {
      mouseX = -9999;
      mouseY = -9999;
    }

    let resizeTimer = 0;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }

    function onVisibility() {
      running = document.visibilityState === "visible";
      if (running) tick();
    }

    function tick() {
      if (!running) return;
      const t = performance.now() / 1000;
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Continuous, never-reversing circular drift around the particle's
        // home point (angle is a pure function of elapsed time, so it always
        // advances the same direction rather than oscillating back and forth).
        const angle = t * p.orbitSpeed + p.orbitPhase;
        const targetX = p.homeX + Math.cos(angle) * p.orbitRadius;
        const targetY = p.homeY + Math.sin(angle) * p.orbitRadius;

        if (pointerFine) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < CURSOR_RADIUS) {
            const push = (1 - dist / CURSOR_RADIUS) * CURSOR_FORCE;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * push * 0.02;
            p.vy += Math.sin(angle) * push * 0.02;
          }
        }

        p.vx += (targetX - p.x) * RETURN_EASE;
        p.vy += (targetY - p.y) * RETURN_EASE;
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;

        const rgb = colors[p.colorIndex];
        ctx!.beginPath();
        ctx!.fillStyle = `rgb(${rgb} / ${alpha})`;
        ctx!.shadowBlur = GLOW_BLUR;
        ctx!.shadowColor = `rgb(${rgb} / ${alpha})`;
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    readTheme();
    resize();
    tick();

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (pointerFine) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0" />;
}
