import { defineEventHandler, getRequestIP, setResponseHeader, setResponseStatus } from "h3";
import { createLimiter, hashIp, issueToken } from "../../../src/lib/waitlist/security";

/*
 * A plain Nitro/h3 route rather than a TanStack Start server function: see
 * the note in vite.config.ts. createServerFn's own request-handling chunk
 * has a build-time circular-import bug under this Nitro version once any
 * server function exists at all, breaking every route on the site. Nitro's
 * native filesystem routing (used here) doesn't go through that pipeline.
 */

const globalLimit = createLimiter({ name: "global_token", limit: 240, windowMs: 60 * 1000 });
const perIpLimit = createLimiter({ name: "token", limit: 40, windowMs: 10 * 60 * 1000 });

export default defineEventHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");

  const ipHash = hashIp(getRequestIP(event, { xForwardedFor: true }));

  const burst = globalLimit(":global:");
  if (!burst.ok) {
    setResponseHeader(event, "Retry-After", String(burst.retryAfter));
    setResponseStatus(event, 429);
    return { error: "Too many requests. Try again shortly.", retryAfter: burst.retryAfter };
  }

  const perIp = perIpLimit(ipHash);
  if (!perIp.ok) {
    setResponseHeader(event, "Retry-After", String(perIp.retryAfter));
    setResponseStatus(event, 429);
    return { error: "Too many requests. Try again shortly.", retryAfter: perIp.retryAfter };
  }

  return issueToken(ipHash);
});
