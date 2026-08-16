// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig, type LovableViteTanstackOptions } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Opt in to Nitro without hard-pinning a preset, so platform auto-detection
  // (NITRO_PRESET / VERCEL / NETLIFY env vars, via std-env) picks the right
  // target for whichever platform actually runs the build — Vercel and
  // Netlify both deploy from this same config. Lovable's own build pipeline
  // sets LOVABLE_NITRO_PRESET and still wins inside that environment.
  //
  // serverDir enables Nitro's own filesystem-routed server/api handlers
  // (used by the waitlist backend) alongside TanStack Start's SSR routing.
  // This wrapper's own `nitro` option type is deliberately narrower than
  // real Nitro config (see its doc comment: "narrow on purpose... file an
  // issue if you need more") and doesn't list serverDir, even though it's a
  // real top-level NitroConfig key that gets forwarded as-is at runtime.
  nitro: { serverDir: "./server" } as unknown as NonNullable<LovableViteTanstackOptions["nitro"]>,
});
