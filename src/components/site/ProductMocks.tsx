import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { UserAvatar } from "./UserAvatar";

const messages = [
  { from: "customer", text: "Hi, I'm having trouble with the chat widget on mobile Safari." },
  { from: "agent", text: "Thanks for the report, can you confirm which iOS version?" },
  { from: "customer", text: "It's iOS 18.1, started after your v3.2 update." },
];

// Every row enters as a typing indicator first and swaps to its real text
// once the phase advances further, so there's never a blank/loading-looking
// gap before a message shows up; the typing indicator itself is what's
// visible while "waiting".
const TYPING_PHASE = [1, 3, 5];
const TEXT_PHASE = [2, 4, 6];
const FINAL_PHASE = 7;

const agentBubbleStyle = { background: "linear-gradient(135deg, var(--violet), var(--blue))" };

/**
 * Plays the conversation once, staged, the first time it scrolls into view.
 * Each message enters as a typing indicator, then swaps to its real text:
 * customer, agent, customer, ending with a blinking caret in the reply box.
 * Every row is always mounted (just opacity/transform-hidden pre-reveal) so
 * the container height never shifts as the sequence advances, and nothing
 * ever sits there blank waiting to appear; the typing indicator is what's
 * visible during that gap. Skips straight to the final state under
 * prefers-reduced-motion instead of just letting the CSS transition
 * durations collapse to zero, since the setTimeout chain itself would still
 * take real time otherwise.
 */
export function InboxMock() {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const [phase, setPhase] = useState(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!shown) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(FINAL_PHASE);
      return undefined;
    }

    const schedule = (delay: number, next: number) => {
      timeouts.current.push(setTimeout(() => setPhase(next), delay));
    };
    setPhase(1);
    schedule(650, 2);
    schedule(1450, 3);
    schedule(2150, 4);
    schedule(2950, 5);
    schedule(3600, 6);
    schedule(4200, 7);

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [shown]);

  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-[13px] font-semibold sm:text-sm">
          <UserAvatar name="Sarah Chen" initials="SC" size="size-6" />
          Sarah Chen
          <span className="rounded border border-hairline px-1 py-px text-[9px] font-normal text-muted-foreground">
            VIP
          </span>
        </span>
        <span className="text-[11px] text-muted-foreground">Linear · Pro Plan</span>
      </div>

      <div
        ref={ref}
        className="mt-5 flex flex-col gap-2.5 overflow-hidden rounded-lg border border-hairline bg-surface p-4"
      >
        {messages.map((m, i) => {
          const isAgent = m.from === "agent";
          const typingAt = TYPING_PHASE[i] ?? FINAL_PHASE;
          const textAt = TEXT_PHASE[i] ?? FINAL_PHASE;
          const rowVisible = phase >= typingAt;
          const isTyping = phase >= typingAt && phase < textAt;
          return (
            <div
              key={i}
              className={
                "message-pop flex items-end gap-2" +
                (rowVisible ? " message-pop-in" : "") +
                (isAgent ? " flex-row-reverse" : "")
              }
            >
              <UserAvatar
                name={isAgent ? "John Doe" : "Sarah Chen"}
                initials={isAgent ? "JD" : "SC"}
                size="size-6"
              />
              {isTyping ? (
                <span
                  className={
                    "flex items-center gap-1 rounded-lg px-3 py-2" +
                    (isAgent ? "" : " border border-hairline bg-surface-2")
                  }
                  style={isAgent ? agentBubbleStyle : undefined}
                  aria-label={isAgent ? "Agent is typing" : "Sarah is typing"}
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className={
                        "size-1.5 animate-bounce rounded-full" +
                        (isAgent ? " bg-background/80" : " bg-foreground/50")
                      }
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <span
                  className={
                    "max-w-[80%] rounded-lg px-3 py-2 text-[12px] leading-snug" +
                    (isAgent
                      ? " text-background"
                      : " border border-hairline bg-surface-2 text-foreground")
                  }
                  style={isAgent ? agentBubbleStyle : undefined}
                >
                  {m.text}
                </span>
              )}
            </div>
          );
        })}
        <div
          className={
            "message-rise mt-1.5 flex items-center gap-2 rounded-md border border-hairline bg-surface-2/60 px-3 py-2 text-[11px] text-muted-foreground" +
            (phase >= FINAL_PHASE ? " message-rise-in" : "")
          }
        >
          Reply to Sarah…
          {phase >= FINAL_PHASE && (
            <span className="ml-0.5 h-3 w-px animate-pulse bg-foreground/50" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

const customers = [
  { initials: "SC", name: "Sarah Chen", company: "Linear", plan: "Enterprise", csat: "4.8", status: "Active" },
  { initials: "MJ", name: "Marcus Johnson", company: "Stripe", plan: "Enterprise", csat: "4.6", status: "Active" },
  { initials: "ER", name: "Emily Rodriguez", company: "Notion", plan: "Pro", csat: "4.9", status: "Active" },
  { initials: "AK", name: "Alex Kim", company: "Vercel", plan: "Pro", csat: "4.5", status: "Active" },
];

export function CustomersMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold sm:text-sm">Customers</span>
        <span className="text-[11px] text-muted-foreground">2,847 total</span>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="grid grid-cols-[1.6fr_0.7fr_0.6fr] gap-2 border-b border-hairline px-4 py-2 text-[10px] tracking-wide text-muted-foreground uppercase sm:grid-cols-[1.6fr_1fr_0.7fr_0.6fr]">
          <span>Customer</span>
          <span className="hidden sm:inline">Company</span>
          <span>Plan</span>
          <span>CSAT</span>
        </div>
        <ul>
          {customers.map((c, i) => (
            <li
              key={c.name}
              className={
                "grid grid-cols-[1.6fr_0.7fr_0.6fr] items-center gap-2 px-4 py-2.5 sm:grid-cols-[1.6fr_1fr_0.7fr_0.6fr]" +
                (i < customers.length - 1 ? " border-b border-hairline" : "")
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <UserAvatar name={c.name} initials={c.initials} size="size-6" />
                <span className="truncate text-[12px] font-medium">{c.name}</span>
              </span>
              <span className="hidden truncate text-[11.5px] text-muted-foreground sm:inline">
                {c.company}
              </span>
              <span className="text-[11px] text-muted-foreground">{c.plan}</span>
              <span className="text-[11.5px] font-medium text-blue">{c.csat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const team = [
  { initials: "JD", name: "John Doe", role: "Admin", online: true, active: 6 },
  { initials: "AL", name: "Amy Liu", role: "Agent", online: true, active: 4 },
  { initials: "CR", name: "Carlos Ruiz", role: "Agent", online: true, active: 8 },
  { initials: "DK", name: "Dana Kim", role: "Agent", online: false, active: 0 },
];

const teamStats = [
  { label: "Members", value: "8" },
  { label: "Online now", value: "4" },
  { label: "Avg response", value: "1m 52s" },
  { label: "Team CSAT", value: "4.7" },
];

export function TeamMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold sm:text-sm">Team</span>
        <span className="text-[11px] text-muted-foreground">8 members</span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
        {teamStats.map((stat) => (
          <div key={stat.label} className="bg-surface p-3 text-center sm:p-3.5">
            <p className="text-sm font-semibold sm:text-base">{stat.value}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <ul className="mt-3 overflow-hidden rounded-lg border border-hairline bg-surface">
        {team.map((m, i) => (
          <li
            key={m.name}
            className={
              "flex items-center gap-3 px-4 py-2.5" +
              (i < team.length - 1 ? " border-b border-hairline" : "")
            }
          >
            <span className="relative">
              <UserAvatar name={m.name} initials={m.initials} size="size-7" />
              <span
                className={
                  "absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-surface " +
                  (m.online ? "bg-blue" : "bg-foreground/20")
                }
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">{m.name}</span>
              <span className="text-[11px] text-muted-foreground">{m.role}</span>
            </span>
            <span className="shrink-0 text-[10.5px] text-muted-foreground">
              {m.active ? `${m.active} active` : "Offline"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const websites = [
  { domain: "app.nortia.io", meta: "1,204 conversations", active: true },
  { domain: "docs.slang.io", meta: "388 conversations", active: true },
  { domain: "staging.kite.finance", meta: "12 conversations", active: false },
];

export function WebsitesMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold sm:text-sm">Websites</span>
        <span className="text-[11px] text-muted-foreground">3 connected</span>
      </div>

      <ul className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface">
        {websites.map((site, i) => (
          <li
            key={site.domain}
            className={
              "flex items-center gap-3 px-4 py-2.5" +
              (i < websites.length - 1 ? " border-b border-hairline" : "")
            }
          >
            <span className={"size-1.5 shrink-0 rounded-full " + (site.active ? "bg-blue" : "bg-foreground/20")} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">{site.domain}</span>
              <span className="text-[11px] text-muted-foreground">{site.meta}</span>
            </span>
            <span
              className={
                "shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium tracking-wide" +
                (site.active
                  ? " border-blue/25 bg-blue/10 text-blue"
                  : " border-hairline text-muted-foreground")
              }
            >
              {site.active ? "Active" : "Inactive"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const accentColors = ["var(--violet)", "var(--blue)", "oklch(0.7 0.16 70)", "oklch(0.62 0.22 25)"];

export function WidgetSettingsMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold sm:text-sm">Widget settings</span>
        <span className="text-[11px] text-muted-foreground">Live preview</span>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface p-4">
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Accent color</p>
        <div className="mt-2.5 flex gap-2">
          {accentColors.map((color, i) => (
            <span
              key={color}
              className={
                "size-5 rounded-full" + (i === 0 ? " ring-2 ring-offset-2 ring-offset-surface ring-violet" : "")
              }
              style={{ background: color }}
            />
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-[70%] overflow-hidden rounded-lg border border-hairline">
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: "linear-gradient(135deg, var(--violet), var(--blue))" }}
            >
              <span className="size-6 shrink-0 rounded-full bg-background/25" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-semibold text-background">
                  Slang support
                </span>
                <span className="text-[9.5px] text-background/75">Online · replies in seconds</span>
              </span>
            </div>
            <div className="bg-surface-2/60 px-3 py-2.5">
              <span className="inline-block rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-[11px] text-foreground">
                Hi there, how can we help?
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="grid size-9 place-items-center rounded-full bg-blue text-background shadow-sm">
          <MessageCircle className="size-4.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

const sessions = [
  { device: "MacBook Pro (Safari 17)", meta: "Berlin, DE · Now", thisDevice: true },
  { device: "iPhone 15 (Slang iOS)", meta: "Berlin, DE · 3h ago", thisDevice: false },
  { device: "Windows 11 (Chrome 126)", meta: "Lagos, NG · 2d ago", thisDevice: false },
];

export function SecurityMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold sm:text-sm">Security</span>
        <span className="text-[11px] text-muted-foreground">3 sessions</span>
      </div>

      <ul className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface">
        {sessions.map((session, i) => (
          <li
            key={session.device}
            className={
              "flex items-center gap-3 px-4 py-2.5" +
              (i < sessions.length - 1 ? " border-b border-hairline" : "")
            }
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate text-[12px] font-medium">
                <span className="truncate">{session.device}</span>
                {session.thisDevice ? (
                  <span className="shrink-0 rounded border border-blue/25 bg-blue/10 px-1 py-px text-[9px] font-normal text-blue">
                    This device
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] text-muted-foreground">{session.meta}</span>
            </span>
            {!session.thisDevice ? (
              <span className="shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Revoke
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
