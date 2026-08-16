const avatarGradient = {
  background:
    "linear-gradient(135deg, color-mix(in oklab, var(--violet) 55%, transparent), color-mix(in oklab, var(--blue) 45%, transparent))",
};

function Avatar({ initials, size = "size-7" }: { initials: string; size?: string }) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-full text-[10px] font-semibold`}
      style={avatarGradient}
    >
      {initials}
    </span>
  );
}

const messages = [
  { from: "customer", text: "Hi, I'm having trouble with the chat widget on mobile Safari." },
  { from: "agent", text: "Thanks for the report, can you confirm which iOS version?" },
  { from: "customer", text: "It's iOS 18.1, started after your v3.2 update." },
];

export function InboxMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold sm:text-sm">
          Sarah Chen
          <span className="rounded border border-hairline px-1 py-px text-[9px] font-normal text-muted-foreground">
            VIP
          </span>
        </span>
        <span className="text-[11px] text-muted-foreground">Linear · Pro Plan</span>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 overflow-hidden rounded-lg border border-hairline bg-surface p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={"flex items-end gap-2" + (m.from === "agent" ? " flex-row-reverse" : "")}
          >
            <Avatar initials={m.from === "agent" ? "JD" : "SC"} size="size-6" />
            <span
              className={
                "max-w-[80%] rounded-lg px-3 py-2 text-[12px] leading-snug" +
                (m.from === "agent"
                  ? " text-background"
                  : " border border-hairline bg-surface-2 text-foreground")
              }
              style={
                m.from === "agent"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--violet), var(--blue))",
                    }
                  : undefined
              }
            >
              {m.text}
            </span>
          </div>
        ))}
        <div className="mt-1.5 flex items-center gap-2 rounded-md border border-hairline bg-surface-2/60 px-3 py-2 text-[11px] text-muted-foreground">
          Reply to Sarah…
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
        <div className="grid grid-cols-[1.6fr_1fr_0.7fr_0.6fr] gap-2 border-b border-hairline px-4 py-2 text-[10px] tracking-wide text-muted-foreground uppercase">
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
                "grid grid-cols-[1.6fr_1fr_0.7fr_0.6fr] items-center gap-2 px-4 py-2.5" +
                (i < customers.length - 1 ? " border-b border-hairline" : "")
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <Avatar initials={c.initials} size="size-6" />
                <span className="truncate text-[12px] font-medium">{c.name}</span>
              </span>
              <span className="hidden truncate text-[11.5px] text-muted-foreground sm:inline">
                {c.company}
              </span>
              <span className="text-[11px] text-muted-foreground">{c.plan}</span>
              <span className="text-[11.5px] font-medium text-emerald-400">{c.csat}</span>
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
              <Avatar initials={m.initials} />
              <span
                className={
                  "absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-surface " +
                  (m.online ? "bg-emerald-400" : "bg-foreground/20")
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
