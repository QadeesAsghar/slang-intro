import type { MongoClient, Collection } from "mongodb";

/*
 * Ported from waitlist-page's server/lib/db.js. The connection string is
 * read from the environment and never leaves this process -- nothing under
 * src/ that runs in the browser can see it, this module only ever executes
 * server-side (called from waitlist server functions).
 *
 * `mongodb` is dynamically imported inside getClient() rather than statically
 * at the top of this file: statically importing it pulled its full (large)
 * dependency graph into the same eagerly-bundled server entry as start.ts's
 * CSRF middleware, and past a certain combined chunk size Nitro's build
 * split that entry into two chunks with a circular import between them --
 * `createCsrfMiddleware` ended up undefined at the point it was called,
 * breaking every route, not just this one. Loading mongodb lazily (it's only
 * ever needed once an actual signup/health-check request comes in) keeps
 * the statically-bundled graph small enough to avoid that split.
 */

export interface WaitlistDoc {
  email: string;
  emailKey: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
  status: "pending";
  source: string;
  ipHash: string;
  referrer?: string | undefined;
  userAgent?: string | undefined;
  locale?: string | undefined;
  timeZone?: string | undefined;
}

let connecting: Promise<MongoClient> | null = null;

function uri(): string {
  const value = process.env["MONGODB_URI"];
  if (!value) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }
  return value;
}

/**
 * One pooled client for the whole process, created lazily.
 *
 * The promise itself is cached rather than the resolved client so that
 * concurrent first requests share a single connect() instead of racing to
 * open a pool each.
 */
export function getClient(): Promise<MongoClient> {
  if (!connecting) {
    connecting = import("mongodb").then(({ MongoClient }) => {
      const client = new MongoClient(uri(), {
        appName: "slang-waitlist",
        maxPoolSize: 10,
        minPoolSize: 0,
        retryWrites: true,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000,
      });
      return client.connect();
    });

    connecting.catch(() => {
      // Don't cache a failed attempt - the next request should try again
      connecting = null;
    });
  }
  return connecting;
}

export async function getWaitlist(): Promise<Collection<WaitlistDoc>> {
  const client = await getClient();
  return client.db(process.env["MONGODB_DB"] || "slang").collection<WaitlistDoc>("waitlist");
}

/**
 * `emailKey` carries the uniqueness guarantee, so a duplicate signup is a
 * write that fails with E11000 rather than a read-then-write race.
 */
export async function ensureIndexes(): Promise<void> {
  const waitlist = await getWaitlist();
  await waitlist.createIndexes([
    { key: { emailKey: 1 }, name: "emailKey_unique", unique: true },
    { key: { createdAt: -1 }, name: "createdAt_desc" },
    { key: { ipHash: 1, createdAt: -1 }, name: "ipHash_createdAt" },
  ]);
}
