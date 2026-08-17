import {
  defineEventHandler,
  getRequestIP,
  getRequestHeader,
  readBody,
  setResponseHeader,
  setResponseStatus,
} from "h3";
import { getWaitlist } from "../../../src/lib/waitlist/db";
import { sendWelcomeEmail } from "../../../src/lib/waitlist/email";
import {
  createLimiter,
  domainAcceptsMail,
  hashIp,
  normalizeEmail,
  trim,
  verifyPow,
  verifyToken,
} from "../../../src/lib/waitlist/security";

/*
 * A plain Nitro/h3 route; see the note in token.get.ts and vite.config.ts
 * for why this isn't a TanStack Start server function. Ported from
 * waitlist-page's server/routes/waitlist.js POST handler; same layering
 * (cheapest check first: origin/honeypot/rate-limit before the token HMAC,
 * before proof-of-work, before a DNS round trip, before Mongo).
 */

interface SubmitBody {
  email?: string;
  token?: string;
  nonce?: string;
  company_website?: string;
  fax?: string;
  source?: string;
  referrer?: string;
  locale?: string;
  timeZone?: string;
}

const globalLimit = createLimiter({ name: "global_submit", limit: 240, windowMs: 60 * 1000 });
const perIpLimit = createLimiter({ name: "submit", limit: 5, windowMs: 10 * 60 * 1000 });

const ALLOWED_ORIGINS = (process.env["ALLOWED_ORIGINS"] || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

/**
 * Only enforced when the header is actually present; see the matching
 * comment in the ported source for why a missing Origin header isn't
 * treated as a rejection.
 */
function originAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (!ALLOWED_ORIGINS.length) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function honeypotTripped(companyWebsite: unknown, fax: unknown): boolean {
  return [companyWebsite, fax].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");

  if (!originAllowed(getRequestHeader(event, "origin"))) {
    setResponseStatus(event, 403);
    return { error: "Request blocked." };
  }

  const body = (await readBody<SubmitBody>(event)) ?? {};
  const ipHash = hashIp(getRequestIP(event, { xForwardedFor: true }));

  /*
   * A tripped honeypot reports success; see the matching comment in the
   * ported source for why this is a silent no-op rather than a rejection.
   */
  if (honeypotTripped(body.company_website, body.fax)) {
    return { ok: true, status: "submitted" };
  }

  const burst = globalLimit(":global:");
  if (!burst.ok) {
    setResponseHeader(event, "Retry-After", String(burst.retryAfter));
    setResponseStatus(event, 429);
    return { error: "Too many requests. Try again in a moment.", retryAfter: burst.retryAfter };
  }

  const perIp = perIpLimit(ipHash);
  if (!perIp.ok) {
    setResponseHeader(event, "Retry-After", String(perIp.retryAfter));
    setResponseStatus(event, 429);
    return {
      error: "Too many attempts. Try again in a few minutes.",
      retryAfter: perIp.retryAfter,
    };
  }

  const ticket = verifyToken(body.token, ipHash);
  if (!ticket.ok) {
    // `too_fast` is the one case worth its own copy: a real person who
    // pasted an address and hit enter instantly can just try again.
    const message =
      ticket.reason === "too_fast"
        ? "That was a little quick. Please try once more."
        : "Your session expired. Reload the page and try again.";
    setResponseStatus(event, 400);
    return { error: message, reason: ticket.reason };
  }

  if (!verifyPow(ticket.claims.c, ticket.claims.d, body.nonce)) {
    setResponseStatus(event, 400);
    return { error: "Verification failed. Reload the page and retry.", reason: "pow_invalid" };
  }

  const parsed = normalizeEmail(body.email);
  if (!parsed.ok) {
    setResponseStatus(event, 400);
    return { error: parsed.error };
  }

  const deliverable = domainAcceptsMail(parsed.domain);
  if (!deliverable.ok) {
    setResponseStatus(event, 400);
    return { error: deliverable.error };
  }

  let waitlist;
  try {
    waitlist = await getWaitlist();
  } catch (err) {
    console.error("[waitlist] database unavailable:", err instanceof Error ? err.message : err);
    setResponseStatus(event, 503);
    return { error: "We couldn't save that right now. Please retry." };
  }

  const now = new Date();

  try {
    await waitlist.insertOne({
      email: parsed.email,
      emailKey: parsed.emailKey,
      domain: parsed.domain,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      source: trim(body.source, 64) || "landing",
      // Hashed, never the raw address - see hashIp()
      ipHash,
      referrer: trim(body.referrer, 512),
      userAgent: trim(getRequestHeader(event, "user-agent"), 512),
      locale: trim(body.locale, 32),
      timeZone: trim(body.timeZone, 64),
    });

    // Dispatch welcome email via configured SMTP (Gmail/Outlook) or Resend
    try {
      await sendWelcomeEmail(parsed.email);
    } catch (err) {
      console.error(
        "[waitlist] welcome email dispatch error:",
        err instanceof Error ? err.message : err,
      );
    }

    ticket.burn();
    setResponseStatus(event, 201);
    return { ok: true, status: "submitted" };
  } catch (err) {
    /*
     * 11000 is the unique index on emailKey doing its job. Answering
     * exactly as we would for a fresh insert keeps the endpoint from
     * becoming an oracle for "is this address on the list".
     */
    if ((err as { code?: number })?.code === 11000) {
      ticket.burn();
      return { ok: true, status: "already_joined" };
    }

    console.error("[waitlist] insert failed:", err instanceof Error ? err.message : err);
    setResponseStatus(event, 503);
    return { error: "We couldn't save that right now. Please retry." };
  }
});
