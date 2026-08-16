import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface ParticleData {
  t: number;
  speed: number;
  mx: number;
  my: number;
  mz: number;
  cx: number;
  cy: number;
  cz: number;
  randomRadiusOffset: number;
  idlePhase: number;
}

interface AntigravityLayerProps {
  count: number;
  color: string;
  opacity?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  fieldStrength?: number;
  idleRadius?: number;
  idleSpeed?: number;
  autoWanderPhase?: number;
}

/**
 * One instanced layer of small capsule particles. Every particle idles in a
 * slow orbit around its own scattered home position (so the whole field is
 * always visibly moving, not just the area near the cursor), and particles
 * that come within `magnetRadius` of the cursor (or, after 2s of no mouse
 * movement, of a slow auto-wandering point — the fallback used on touch
 * devices and whenever the mouse is idle) gather into a small rotating ring
 * instead. Adapted from a user-supplied React Three Fiber component: kept
 * the magnet/ring mechanic and per-particle wave/pulse math as given, added
 * the idle-orbit fallback so particles outside the magnet radius don't sit
 * fully still.
 */
function AntigravityLayer({
  count,
  color,
  opacity = 0.6,
  magnetRadius = 7,
  ringRadius = 4.5,
  waveSpeed = 0.4,
  waveAmplitude = 0.8,
  particleSize = 1,
  lerpSpeed = 0.08,
  particleVariance = 1,
  rotationSpeed = 0.06,
  depthFactor = 1,
  pulseSpeed = 2.2,
  fieldStrength = 10,
  idleRadius = 1.4,
  idleSpeed = 0.12,
  autoWanderPhase = 0,
}: AntigravityLayerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseMoveTime = useRef(0);
  const virtualMouse = useRef({ x: 0, y: 0 });

  const particles = useMemo<ParticleData[]>(() => {
    const width = viewport.width || 100;
    const height = viewport.height || 100;
    return Array.from({ length: count }, () => {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;
      return {
        t: Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2,
        idlePhase: Math.random() * Math.PI * 2,
      };
    });
  }, [count, viewport.width, viewport.height]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { viewport: v, pointer: m } = state;
    const elapsed = state.clock.getElapsedTime();

    const mouseDist = Math.hypot(m.x - lastMousePos.current.x, m.y - lastMousePos.current.y);
    if (mouseDist > 0.001) {
      lastMouseMoveTime.current = Date.now();
      lastMousePos.current = { x: m.x, y: m.y };
    }

    let destX = (m.x * v.width) / 2;
    let destY = (m.y * v.height) / 2;

    if (Date.now() - lastMouseMoveTime.current > 2000) {
      const time = elapsed + autoWanderPhase;
      destX = Math.sin(time * 0.5) * (v.width / 4);
      destY = Math.cos(time * 0.5 * 2) * (v.height / 4);
    }

    virtualMouse.current.x += (destX - virtualMouse.current.x) * 0.05;
    virtualMouse.current.y += (destY - virtualMouse.current.y) * 0.05;

    const targetX = virtualMouse.current.x;
    const targetY = virtualMouse.current.y;
    const globalRotation = elapsed * rotationSpeed;

    particles.forEach((particle, i) => {
      particle.t += particle.speed / 2;
      const t = particle.t;
      const { mx, my, mz, cz, randomRadiusOffset, idlePhase } = particle;

      const projectionFactor = 1 - cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;

      const dx = mx - projectedTargetX;
      const dy = my - projectedTargetY;
      const dist = Math.hypot(dx, dy);

      // Default (far from the cursor/wander point): a slow, never-reversing
      // orbit around the particle's own scattered home position.
      const idleAngle = elapsed * idleSpeed + idlePhase;
      const targetPos = {
        x: mx + Math.cos(idleAngle) * idleRadius,
        y: my + Math.sin(idleAngle) * idleRadius,
        z: mz * depthFactor,
      };

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude);
        const deviation = randomRadiusOffset * (5 / (fieldStrength + 0.1));
        const currentRingRadius = ringRadius + wave + deviation;
        targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle);
        targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle);
        targetPos.z = mz * depthFactor + Math.sin(t) * (1 * waveAmplitude * depthFactor);
      }

      particle.cx += (targetPos.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed;

      dummy.position.set(particle.cx, particle.cy, particle.cz);
      dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
      dummy.rotateX(Math.PI / 2);

      const currentDistToMouse = Math.hypot(
        particle.cx - projectedTargetX,
        particle.cy - projectedTargetY,
      );
      const distFromRing = Math.abs(currentDistToMouse - ringRadius);
      const scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10));

      const finalScale =
        Math.max(scaleFactor, 0.55) *
        (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) *
        particleSize;
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.09, 0.36, 4, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </instancedMesh>
  );
}

const FALLBACK_COLORS: [string, string] = ["rgb(132, 121, 255)", "rgb(96, 165, 250)"];

// getComputedStyle(...).color isn't reliable here — depending on the browser
// build, it can echo an oklch() input back verbatim instead of downgrading
// it to rgb(), which THREE.Color can't parse. A 1x1 canvas always rasterizes
// to concrete sRGB bytes regardless of the input color space, so read the
// color back from actual pixel data instead of trusting the computed-style
// string.
let resolveCanvas: HTMLCanvasElement | null = null;
function toRgbString(cssColor: string): string | null {
  resolveCanvas ??= document.createElement("canvas");
  resolveCanvas.width = 1;
  resolveCanvas.height = 1;
  const ctx = resolveCanvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = cssColor.trim();
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * The intro's ambient particle environment — see AntigravityLayer above for
 * the per-particle motion. Two layers (violet + blue, matching the site's
 * own tokens, so it re-themes for free across default/light) share one
 * scene. Skipped entirely under prefers-reduced-motion, and not mounted
 * until after hydration (Canvas/WebGL is client-only).
 */
export function ParticleField() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [colors, setColors] = useState<[string, string]>(FALLBACK_COLORS);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    function readColors() {
      const style = getComputedStyle(document.documentElement);
      setColors([
        toRgbString(style.getPropertyValue("--violet")) ?? FALLBACK_COLORS[0],
        toRgbString(style.getPropertyValue("--blue")) ?? FALLBACK_COLORS[1],
      ]);
    }

    readColors();
    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (!mounted || reducedMotion) return null;

  return (
    <div className="fixed inset-0" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 50], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <AntigravityLayer
          count={60}
          color={colors[0]}
          opacity={0.4}
          particleSize={0.55}
          magnetRadius={7}
          ringRadius={4.5}
        />
        <AntigravityLayer
          count={60}
          color={colors[1]}
          opacity={0.4}
          particleSize={0.55}
          magnetRadius={5.5}
          ringRadius={3.2}
          autoWanderPhase={Math.PI}
          idleSpeed={0.16}
        />
      </Canvas>
    </div>
  );
}
