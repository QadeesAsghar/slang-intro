const stats = [
  { label: "Open conversations", value: "142", trend: "+12%", bars: [30, 45, 35, 60, 50, 70, 90] },
  { label: "First response", value: "1m 48s", trend: "-22%", bars: [80, 65, 70, 55, 60, 45, 35] },
  { label: "CSAT score", value: "4.8", trend: "+3%", bars: [50, 55, 60, 58, 65, 70, 75] },
  { label: "Resolution rate", value: "94.2%", trend: "+1.8%", bars: [60, 62, 68, 70, 75, 80, 85] },
];

const conversations = [
  { initials: "SC", name: "Sarah Chen", tag: "VIP", note: "Widget not loading on mobile Safari", status: "Needs reply" },
  { initials: "MJ", name: "Marcus Johnson", tag: null, note: "API rate limit exceeding on production", status: "Escalated" },
  { initials: "ER", name: "Emily Rodriguez", tag: null, note: "How do I export conversation history?", status: "Open" },
];

const statusStyles: Record<string, string> = {
  "Needs reply": "text-destructive",
  Escalated: "text-destructive",
  Open: "text-blue",
};

export function DashboardMock() {
  return (
    <div className="bg-surface-2/40 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold sm:text-sm">Command Center</span>
        <span className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          847 live visitors
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface p-3.5 sm:p-4">
            <p className="truncate text-[11px] text-muted-foreground">{stat.label}</p>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold sm:text-xl">{stat.value}</span>
              <span
                className={
                  stat.trend.startsWith("-")
                    ? "text-[11px] text-blue"
                    : "text-[11px] text-emerald-400"
                }
              >
                {stat.trend}
              </span>
            </div>
            <div className="mt-2.5 flex h-5 items-end gap-[3px]" aria-hidden="true">
              {stat.bars.map((h, i) => (
                <span
                  key={i}
                  className="w-full rounded-[1px]"
                  style={{
                    height: `${h}%`,
                    background:
                      i === stat.bars.length - 1
                        ? "color-mix(in oklab, var(--violet) 80%, transparent)"
                        : "oklch(1 0 0 / 8%)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 hidden overflow-hidden rounded-lg border border-hairline bg-surface sm:block">
        <div className="border-b border-hairline px-4 py-2.5 text-[11px] text-muted-foreground">
          Priority conversations
        </div>
        <ul>
          {conversations.map((c, i) => (
            <li
              key={c.name}
              className={
                "flex items-center gap-3 px-4 py-2.5" +
                (i < conversations.length - 1 ? " border-b border-hairline" : "")
              }
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, var(--violet) 55%, transparent), color-mix(in oklab, var(--blue) 45%, transparent))",
                }}
              >
                {c.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
                  {c.name}
                  {c.tag ? (
                    <span className="rounded border border-hairline px-1 py-px text-[9px] text-muted-foreground">
                      {c.tag}
                    </span>
                  ) : null}
                </span>
                <span className="block truncate text-[11.5px] text-muted-foreground">{c.note}</span>
              </span>
              <span className={"shrink-0 text-[10.5px] font-medium " + (statusStyles[c.status] ?? "text-muted-foreground")}>
                {c.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
