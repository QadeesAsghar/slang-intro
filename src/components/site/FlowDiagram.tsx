const nodes = [
  { title: "Website", body: "Your product or marketing site." },
  { title: "Slang widget", body: "The chat surface a visitor opens." },
  { title: "Realtime channel", body: "Messages move as they are typed." },
  { title: "Slang platform", body: "Conversations, routing, status and SLA." },
  { title: "Customer record", body: "History and context attached to the person." },
  { title: "Support agent", body: "Replies from the shared inbox." },
];

export function FlowDiagram() {
  return (
    <ol className="mx-auto max-w-xl">
      {nodes.map((node, i) => (
        <li key={node.title}>
          <div className="flex items-start gap-4 rounded-xl border border-hairline bg-surface p-5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 text-xs text-muted-foreground">
              {i + 1}
            </span>
            <div>
              <h3 className="text-[15px] font-semibold">{node.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{node.body}</p>
            </div>
          </div>
          {i < nodes.length - 1 ? (
            <div className="flex h-10 justify-center" aria-hidden="true">
              <span
                className="w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in oklab, var(--violet) 60%, transparent), color-mix(in oklab, var(--blue) 45%, transparent))",
                }}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
