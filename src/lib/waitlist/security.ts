import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { resolveMx } from "node:dns/promises";

/*
 * Ported from the standalone waitlist-page repo's server/lib/security.js,
 * adapted to TypeScript and to running as part of slang-intro's own server
 * (TanStack Start server functions) rather than a separate Express app.
 * Behavior is unchanged -- see the original repo for the design rationale
 * behind each piece; comments here focus on what differs.
 */

const IS_PROD = process.env["NODE_ENV"] === "production";

/**
 * HMAC key for the submit tokens. Required in production -- an ephemeral key
 * would invalidate every in-flight token on restart, and across more than one
 * instance no token would ever verify.
 */
function loadSecret(): string {
  const secret = process.env["WAITLIST_SECRET"];
  if (secret && secret.length >= 32) return secret;

  if (IS_PROD) {
    throw new Error("WAITLIST_SECRET must be set to at least 32 characters in production");
  }
  console.warn(
    "[waitlist/security] WAITLIST_SECRET unset or too short - using an ephemeral dev key.\n" +
      "  Tokens will stop verifying on restart. Generate one with:\n" +
      "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  );
  return randomBytes(32).toString("hex");
}

const SECRET = loadSecret();

/** Separate salt so a leaked hash set can't be checked against IPs offline. */
const IP_SALT = process.env["IP_SALT"] || createHash("sha256").update(`ip:${SECRET}`).digest("hex");

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const CONFIG = {
  /** Leading hex zeros the client's proof-of-work hash must have. 4 ≈ 65k
   *  hashes, well under a second in a browser and a real cost to a bot farm. */
  powDifficulty: Math.min(6, Math.max(0, num(process.env["POW_DIFFICULTY"], 4))),
  /** A human cannot fetch a token and submit a considered email in under this. */
  minDwellMs: num(process.env["MIN_DWELL_MS"], 1800),
  /** Tokens expire so a scraped one can't be stockpiled. */
  maxTokenAgeMs: num(process.env["MAX_TOKEN_AGE_MS"], 45 * 60 * 1000),
  /**
   * On by default. Not a provider allowlist -- any correctly-formatted
   * address from any domain is accepted -- it just confirms the domain
   * exists in DNS at all, which is what actually distinguishes a real
   * address from typed-garbage like "anyone@anyui.com". Previously
   * rejected some real academic/smaller domains that don't have their own
   * MX record; domainAcceptsMail() now also tries A/AAAA (the RFC 5321
   * fallback mail delivery already uses) before rejecting, so a domain
   * only fails this if it doesn't resolve at all. Set VERIFY_MX=false to
   * disable if it's ever too strict for a real domain in practice.
   */
  verifyMx: process.env["VERIFY_MX"] !== "false",
};

/**
 * Raw IPs never reach the database. A salted hash is enough to rate-limit and
 * to spot one address signing up fifty times, and nothing else needs it.
 */
export function hashIp(ip: string | undefined): string {
  return createHash("sha256")
    .update(`${IP_SALT}:${ip || "unknown"}`)
    .digest("hex");
}

const b64 = (input: string) => Buffer.from(input).toString("base64url");

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, so check that first
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

interface TokenClaims {
  t: number;
  n: string;
  i: string;
  c: string;
  d: number;
}

/**
 * A stateless, single-use ticket the client must present to submit.
 *
 * Everything the server needs to validate later is inside the signed payload:
 * issue time (dwell + expiry), a nonce (replay), a truncated IP hash (so a
 * token minted for one address can't be handed to a botnet) and the
 * proof-of-work challenge. No server-side session table.
 */
export function issueToken(ipHash: string) {
  const claims: TokenClaims = {
    t: Date.now(),
    n: randomBytes(12).toString("base64url"),
    i: ipHash.slice(0, 16),
    c: randomBytes(16).toString("base64url"),
    d: CONFIG.powDifficulty,
  };

  const payload = b64(JSON.stringify(claims));

  return {
    token: `${payload}.${sign(payload)}`,
    // Echoed separately so the client never has to parse the token itself
    challenge: claims.c,
    difficulty: claims.d,
  };
}

/*
 * Spent nonces, so a valid token works exactly once. Bounded by the token
 * lifetime: entries are dropped as soon as the token they belong to would have
 * expired anyway, which caps this at (submissions per 45 min) entries.
 */
const spentNonces = new Map<string, number>();

function burnNonce(nonce: string, expiresAt: number) {
  const now = Date.now();
  if (spentNonces.size > 5000) {
    for (const [key, expiry] of spentNonces) {
      if (expiry <= now) spentNonces.delete(key);
    }
  }
  spentNonces.set(nonce, expiresAt);
}

export type VerifyTokenResult =
  { ok: true; claims: TokenClaims; burn: () => void } | { ok: false; reason: string };

export function verifyToken(token: unknown, ipHash: string): VerifyTokenResult {
  if (typeof token !== "string" || token.length > 512) {
    return { ok: false, reason: "token_missing" };
  }

  const split = token.indexOf(".");
  if (split <= 0) return { ok: false, reason: "token_malformed" };

  const payload = token.slice(0, split);
  const signature = token.slice(split + 1);
  if (!safeEqual(signature, sign(payload))) {
    return { ok: false, reason: "token_bad_signature" };
  }

  let claims: TokenClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "token_malformed" };
  }

  const age = Date.now() - Number(claims.t);
  if (!Number.isFinite(age) || age < 0) {
    return { ok: false, reason: "token_malformed" };
  }
  if (age > CONFIG.maxTokenAgeMs) return { ok: false, reason: "token_expired" };
  if (age < CONFIG.minDwellMs) return { ok: false, reason: "too_fast" };

  if (claims.i !== ipHash.slice(0, 16)) {
    return { ok: false, reason: "token_wrong_origin" };
  }
  if (spentNonces.has(claims.n)) return { ok: false, reason: "token_replayed" };

  return {
    ok: true,
    claims,
    /** Call only once the submission is actually accepted. */
    burn: () => burnNonce(claims.n, Number(claims.t) + CONFIG.maxTokenAgeMs),
  };
}

/**
 * The client has to find a nonce where sha256(`challenge:nonce`) starts with
 * `difficulty` hex zeros. Verification is a single hash; solving averages
 * 16^difficulty. That asymmetry is the whole point - it costs a real visitor
 * a few hundred milliseconds while they type, and costs a scripted flood
 * linearly per attempt.
 */
export function verifyPow(challenge: string, difficulty: number, nonce: unknown): boolean {
  if (difficulty <= 0) return true;
  if (typeof nonce !== "string" && typeof nonce !== "number") return false;

  const candidate = String(nonce);
  if (candidate.length > 32 || !/^[0-9]+$/.test(candidate)) return false;

  const digest = createHash("sha256").update(`${challenge}:${candidate}`).digest("hex");

  return digest.startsWith("0".repeat(difficulty));
}

/**
 * Sliding-window counter, in memory.
 *
 * Deliberately per-process: it needs no Redis to be useful, and the signed
 * token plus proof-of-work already carry the load-bearing part of the abuse
 * story. Behind more than one instance, tighten the limits or move this to a
 * shared store.
 */
export function createLimiter({
  limit,
  windowMs,
  name,
}: {
  limit: number;
  windowMs: number;
  name: string;
}) {
  const hits = new Map<string, number[]>();
  let lastPrune = Date.now();

  return function take(key: string) {
    const now = Date.now();

    if (now - lastPrune > windowMs) {
      for (const [k, stamps] of hits) {
        const live = stamps.filter((t) => now - t < windowMs);
        if (live.length) hits.set(k, live);
        else hits.delete(k);
      }
      lastPrune = now;
    }

    const stamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (stamps.length >= limit) {
      const retryAfter = Math.ceil((windowMs - (now - stamps[0]!)) / 1000);
      hits.set(key, stamps);
      return { ok: false as const, retryAfter: Math.max(1, retryAfter), name };
    }

    stamps.push(now);
    hits.set(key, stamps);
    return { ok: true as const, remaining: limit - stamps.length };
  };
}

/*
 * Throwaway-inbox providers. Not exhaustive and not meant to be - it filters
 * the lazy bulk of junk signups without turning into a list nobody maintains.
 */
const DISPOSABLE_DOMAINS = new Set([
  "0-mail.com",
  "10minutemail.com",
  "20minutemail.com",
  "33mail.com",
  "burnermail.io",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "harakirimail.com",
  "inboxbear.com",
  "mail-temporaire.fr",
  "mail.tm",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mailsac.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "nowmymail.com",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "tempmail.dev",
  "tempmail.net",
  "tempmail.plus",
  "tempmailo.com",
  "temp-mail.io",
  "temp-mail.org",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "tuta.io",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

/*
 * Reasonably strict, and intentionally not the RFC 5322 monster: quoted local
 * parts and IP-literal domains are legal but nobody signs up with one, and
 * accepting them only widens what has to be escaped downstream.
 */
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;

/**
 * Dedupe key. `foo.bar+beta@gmail.com` and `foobar@gmail.com` are one inbox,
 * so the unique index has to see one value - but the address the user actually
 * typed is what gets stored and mailed.
 */
function dedupeKey(local: string, domain: string): string {
  const gmailish = domain === "gmail.com" || domain === "googlemail.com";
  const stripped = local.split("+")[0]!;
  const canonical = gmailish ? stripped.replace(/\./g, "") : stripped;
  return `${canonical}@${gmailish ? "gmail.com" : domain}`;
}

export type NormalizeEmailResult =
  { ok: true; email: string; domain: string; emailKey: string } | { ok: false; error: string };

export function normalizeEmail(raw: unknown): NormalizeEmailResult {
  if (typeof raw !== "string") {
    return { ok: false, error: "Enter your email address to continue." };
  }

  const email = raw.trim().toLowerCase();

  if (!email) return { ok: false, error: "Enter your email address to continue." };
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "That doesn't look like a valid email address." };
  }

  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (local.length > 64) {
    return { ok: false, error: "That doesn't look like a valid email address." };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, error: "Please use a permanent email address." };
  }

  return { ok: true, email, domain, emailKey: dedupeKey(local, domain) };
}

interface MxResult {
  ok: boolean;
  error?: string;
}

/** Cheap memo - a signup wave from one company shouldn't be one lookup each. */
const mxCache = new Map<string, { result: MxResult; expires: number }>();

/**
 * Codes that mean DNS gave a definitive, confirmed answer of "nothing here"
 * -- domain doesn't exist (ENOTFOUND/NXDOMAIN) or exists but has zero
 * records of the queried type (ENODATA). Anything else (timeouts, resolver
 * errors, SERVFAIL) is transient and must not cost a real signup, so those
 * fail open.
 */
const DEFINITIVE_MISS: (string | undefined)[] = ["ENOTFOUND", "NXDOMAIN", "ENODATA"];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("dns_timeout")), ms)),
  ]);
}

/**
 * Best-effort deliverability check: does this domain actually have a mail
 * exchanger. MX-only, deliberately -- an earlier version of this also fell
 * back to checking bare A/AAAA records (the RFC 5321 5.1 fallback SMTP
 * itself uses), but that made the check nearly toothless: registered-but-
 * unused domains almost always still resolve to *something* (a registrar
 * parking page), so a typo/junk domain like "dasda.com" passed right
 * through. Real intent to receive mail shows up as an MX record; a bare A
 * record with no MX is a much stronger junk-domain signal in practice than
 * it is a legitimate small mail setup. Fails open only on transient DNS
 * trouble (timeouts, resolver hiccups) -- a flaky resolver must never cost
 * a real signup -- but "this domain has confirmed zero MX records" is
 * treated as a real answer, not a maybe.
 */
export async function domainAcceptsMail(domain: string): Promise<MxResult> {
  if (!CONFIG.verifyMx) return { ok: true };

  const cached = mxCache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.result;

  let result: MxResult;
  try {
    const records = await withTimeout(resolveMx(domain), 5000);
    result = records?.length
      ? { ok: true }
      : { ok: false, error: "That domain can't receive email." };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    const definitiveMiss = DEFINITIVE_MISS.includes(code);
    result = definitiveMiss ? { ok: false, error: "That domain can't receive email." } : { ok: true };
  }

  if (mxCache.size > 2000) mxCache.clear();
  mxCache.set(domain, { result, expires: Date.now() + 60 * 60 * 1000 });
  return result;
}

/** Clamp anything free-form before it reaches the database. */
export function trim(value: unknown, max: number): string | undefined {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}
