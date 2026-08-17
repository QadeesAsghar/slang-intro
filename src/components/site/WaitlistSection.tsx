import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lottie } from "lottie-react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";
import { useMagnetic } from "@/hooks/use-magnetic";
import { solveChallenge } from "@/lib/waitlist-pow";
import emailSentAnimation from "@/assets/email-sent.json";

/*
 * Ported from the standalone waitlist-page repo's WaitlistForm.tsx, adapted
 * from framer-motion + its own zinc/violet tokens to slang-intro's own
 * motion system (Reveal/RevealText, plain CSS transitions) and OKLCH design
 * tokens, per the decision to make this read as a native section of the
 * site rather than a separately-branded page. The actual signup behavior
 * (honeypots, proof-of-work solve, token fetch/retry, success states) is
 * unchanged from the source.
 *
 * Talks to server/api/waitlist/{token,index,health} via plain fetch(), not
 * TanStack Start server functions; see the note in vite.config.ts for why.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Ticket {
  token: string;
  challenge: string;
  difficulty: number;
}

async function fetchToken(): Promise<Ticket> {
  const res = await fetch("/api/waitlist/token");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Unable to establish secure session. Please retry.");
  }
  return data as Ticket;
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState(""); // honeypot 1
  const [fax, setFax] = useState(""); // honeypot 2
  const [submitted, setSubmitted] = useState("");
  const [submissionState, setSubmissionState] = useState<"submitted" | "already_joined">(
    "submitted",
  );
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const ticketRef = useRef<Ticket | null>(null);
  const powPromiseRef = useRef<Promise<string> | null>(null);
  const submitRef = useMagnetic<HTMLButtonElement>();

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Prefetch a token and start solving its proof-of-work challenge in the
  // background as soon as the form mounts, so submitting never has to wait
  // on either; the answer is already sitting there by the time a real
  // visitor finishes typing.
  useEffect(() => {
    let unmounted = false;
    fetchToken()
      .then((result) => {
        if (unmounted) return;
        ticketRef.current = result;
        powPromiseRef.current = solveChallenge(result.challenge, result.difficulty);
      })
      .catch(() => {
        // Offline or the server is still booting; handleSubmit falls back
        // to fetching a token itself.
      });
    return () => {
      unmounted = true;
    };
  }, []);

  async function refreshTicket() {
    try {
      const result = await fetchToken();
      ticketRef.current = result;
      powPromiseRef.current = solveChallenge(result.challenge, result.difficulty);
    } catch {
      // handled by handleSubmit's own retry path
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;

    const value = email.trim();
    if (!value) {
      setError("Enter your email address to continue.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("That doesn't look like a valid email address.");
      return;
    }

    setError(null);
    setStatus("loading");

    try {
      let ticket = ticketRef.current;
      if (!ticket) {
        ticket = await fetchToken();
        ticketRef.current = ticket;
        powPromiseRef.current = solveChallenge(ticket.challenge, ticket.difficulty);
      }

      const nonce = await (powPromiseRef.current ??
        solveChallenge(ticket.challenge, ticket.difficulty));

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          token: ticket.token,
          nonce,
          company_website: companyWebsite,
          fax,
          source: "landing",
          referrer: typeof document !== "undefined" ? document.referrer : "",
          locale: typeof navigator !== "undefined" ? navigator.language : "",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "Failed to join waitlist. Please try again.");
      }

      setSubmitted(value);
      setSubmissionState(result?.status === "already_joined" ? "already_joined" : "submitted");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please retry.");
      setStatus("idle");
      ticketRef.current = null;
      powPromiseRef.current = null;
      refreshTicket();
    }
  }

  const loading = status === "loading";
  const valid = EMAIL_RE.test(email.trim());

  if (status === "done") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="reveal reveal-in flex flex-col items-center rounded-3xl border border-hairline bg-surface/80 px-6 py-10 text-center backdrop-blur"
      >
        {reducedMotion ? (
          <span className="mb-4 grid size-14 place-items-center rounded-full border border-blue/25 bg-blue/10">
            <Check className="size-6 text-blue" />
          </span>
        ) : (
          <Lottie
            src={emailSentAnimation}
            loop={false}
            autoplay
            className="mb-2"
            style={{ width: 128, height: 128 }}
            aria-hidden="true"
          />
        )}
        <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
          {submissionState === "already_joined"
            ? "You're already on the list"
            : "You're on the list"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {submissionState === "already_joined" ? (
            <>
              <span className="font-medium break-all text-foreground">{submitted}</span> is already
              on our waitlist. You're all set, and we'll reach out as soon as your workspace is
              ready.
            </>
          ) : (
            <>
              We'll email <span className="font-medium break-all text-foreground">{submitted}</span>{" "}
              the moment your workspace is ready.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      {/*
        Honeypots to catch spam bots without affecting humans. display:none
        (not just off-screen positioning) is deliberate: Chrome's own
        autofill explicitly skips display:none fields but does still target
        off-screen-positioned ones, and real users were getting silently
        caught by their own browser autofilling these on real submissions.
        The field names are likewise generic-but-obscure rather than
        "company_website"/"fax": names common enough to be real business
        form fields are exactly what both autofill heuristics and
        honeypot-aware privacy extensions key off of.
      */}
      <div aria-hidden="true" style={{ display: "none" }}>
        <input
          type="text"
          name="hp_field_a"
          tabIndex={-1}
          autoComplete="off"
          value={companyWebsite}
          onChange={(e) => setCompanyWebsite(e.target.value)}
        />
        <input
          type="text"
          name="hp_field_b"
          tabIndex={-1}
          autoComplete="off"
          value={fax}
          onChange={(e) => setFax(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-hairline sm:bg-surface/60 sm:p-1.5">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <div
          className={
            "relative min-h-12 w-full rounded-2xl border transition-colors sm:min-h-11 sm:rounded-full sm:border-transparent sm:bg-transparent" +
            (error
              ? " border-destructive/50 bg-destructive/[0.06]"
              : " border-hairline bg-surface-2/60")
          }
        >
          <input
            id="waitlist-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value && !EMAIL_RE.test(value)) {
                setError("That doesn't look like a valid email address.");
              }
            }}
            placeholder="you@company.com"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={!!error}
            aria-describedby={error ? "waitlist-error" : undefined}
            className="absolute inset-0 h-full w-full rounded-[inherit] bg-transparent pr-11 pl-5 text-base text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          {valid && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-blue/15 transition-transform"
            >
              <Check className="size-3 text-blue" />
            </span>
          )}
        </div>

        <Button
          ref={submitRef}
          type="submit"
          size="lg"
          disabled={loading}
          aria-busy={loading}
          className="min-h-12 w-full shrink-0 rounded-2xl sm:min-h-11 sm:w-auto sm:rounded-full"
        >
          <span className="grid place-items-center">
            <span
              className={
                "col-start-1 row-start-1 flex items-center gap-2 transition-opacity" +
                (loading ? " opacity-0" : "")
              }
            >
              Join waitlist
              <ArrowRight className="size-4" />
            </span>
            <span
              className={
                "col-start-1 row-start-1 transition-opacity" + (loading ? "" : " opacity-0")
              }
            >
              <Loader2 className="size-4 animate-spin" />
            </span>
          </span>
        </Button>
      </div>

      {error && (
        <p id="waitlist-error" role="alert" className="mt-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

export function WaitlistSection() {
  return (
    <section id="waitlist" className="relative overflow-hidden pt-32 pb-24 lg:pt-40">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-70"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 0%, color-mix(in oklab, var(--violet) 24%, transparent), transparent 70%), radial-gradient(40% 35% at 75% 10%, color-mix(in oklab, var(--blue) 16%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-2xl px-5 text-center lg:px-8">
        <Reveal direction="up">
          <p className="text-[11px] font-medium tracking-[0.18em] text-violet uppercase">
            Waitlist
          </p>
        </Reveal>
        <RevealText
          as="h1"
          text="Be first in line for Slang."
          className="mt-4 block text-4xl leading-[1.1] font-semibold text-balance sm:text-5xl"
          stagger={45}
        />
        <Reveal delay={180}>
          <p className="mx-auto mt-5 max-w-lg text-base text-pretty text-muted-foreground">
            We're rolling out access in small batches so every workspace stays fast and reliable.
            Leave your email and we'll notify you the moment yours is ready.
          </p>
        </Reveal>
        <Reveal delay={320} className="mt-9">
          <WaitlistForm />
        </Reveal>
      </div>
    </section>
  );
}
