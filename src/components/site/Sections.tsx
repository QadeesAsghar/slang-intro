import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { ProductFrame } from "./ProductFrame";
import { InboxMock, CustomersMock, TeamMock } from "./ProductMocks";
import { Github, Linkedin, Instagram, Mail, MessageSquare, Users, Workflow } from "lucide-react";

const tourStops = [
  {
    eyebrow: "Conversations",
    title: "A message arrives. An agent answers.",
    body: "The customer writes from your website. The conversation lands in the Slang inbox with its source, status and history already attached.",
    label: "app.slang.app/inbox",
    Mock: InboxMock,
  },
  {
    eyebrow: "Customer context",
    title: "Know who you are talking to.",
    body: "Every conversation is connected to a customer record: company, plan and satisfaction. Nothing has to be asked twice.",
    label: "app.slang.app/customers",
    Mock: CustomersMock,
  },
  {
    eyebrow: "Teams",
    title: "Support that works as one team.",
    body: "Roles, availability and active conversations are visible to everyone, so work goes to the right person, not just the nearest one.",
    label: "app.slang.app/team",
    Mock: TeamMock,
  },
];

const capabilities = [
  {
    title: "Live conversations",
    body: "Website chat, email, WhatsApp and API messages arrive in one shared inbox.",
    icon: MessageSquare,
  },
  {
    title: "Customer context",
    body: "Plan, company, history and satisfaction sit next to every conversation.",
    icon: Users,
  },
  {
    title: "Team workflows",
    body: "Assignment, roles, priority and SLA keep work moving across the team.",
    icon: Workflow,
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.22 0 4.31.87 5.88 2.44a8.26 8.26 0 0 1 2.43 5.8c0 4.55-3.71 8.25-8.27 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.56 3.71-8.25 8.2-8.25Zm-4.5 4.7c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.55.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01Z" />
    </svg>
  );
}

export const socialLinks = [
  {
    label: "WhatsApp channel",
    href: "https://whatsapp.com/channel/0029VbDfaOvF6smtYgb6hn2f",
    icon: WhatsAppIcon,
  },
  {
    label: "GitHub",
    href: "https://github.com/QadeesAsghar",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/slangofficial/",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/slang_chat?igsh=aG10Znpjc250M3c1",
    icon: Instagram,
  },
];

export const contactEmails = ["2025se139@student.uet.edu.pk", "2025se112@student.uet.edu.pk"];

export { WhatsAppIcon };

export function WhatIsSlang() {
  return (
    <section id="product" className="edge-light border-t border-hairline py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="What Slang is"
          title="One system for customer communication."
          align="center"
        >
          A business connects Slang to its website. Conversations, customers, teams and
          performance all live in the same workspace.
        </SectionHeading>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
          {capabilities.map(({ title, body, icon: Icon }, i) => (
            <Reveal as="li" key={title} delay={i * 80} className="bg-surface p-8 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full border border-hairline bg-surface-2 text-violet">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProductTour() {
  return (
    <section className="border-t border-hairline py-24 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-24 px-5 lg:gap-32 lg:px-8">
        {tourStops.map(({ eyebrow, title, body, label, Mock }, i) => {
          const imageFirst = i % 2 === 1;
          return (
            <div
              key={eyebrow}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <SectionHeading
                eyebrow={eyebrow}
                title={title}
                className={"max-w-none" + (imageFirst ? " lg:order-2" : "")}
              >
                {body}
              </SectionHeading>
              <Reveal
                direction={imageFirst ? "left" : "right"}
                delay={100}
                className={imageFirst ? "lg:order-1" : ""}
              >
                <ProductFrame
                  label={label}
                  className="transition-transform duration-300 ease-out will-change-transform hover:-translate-y-1.5"
                >
                  <Mock />
                </ProductFrame>
              </Reveal>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ConnectSection() {
  return (
    <section id="connect" className="edge-light border-t border-hairline py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading eyebrow="Get connected" title="Follow along and reach out." align="center">
          Slang is being built in the open. Join the channel, follow the org, or say hello
          directly.
        </SectionHeading>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {socialLinks.map(({ label, href, icon: Icon }, i) => (
            <Reveal as="li" key={label} delay={i * 80}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col items-center gap-3 bg-surface p-8 text-center transition-colors hover:bg-surface-2"
              >
                <Icon className="size-6 text-muted-foreground transition-colors group-hover:text-violet" />
                <span className="text-sm font-medium">{label}</span>
              </a>
            </Reveal>
          ))}
        </ul>

        <Reveal
          delay={160}
          className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-6"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" aria-hidden="true" />
            Reach the team
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {contactEmails.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="text-sm text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:text-violet"
              >
                {email}
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
