import { socialLinks } from "./Sections";

export function Footer() {
  return (
    <footer className="border-t border-hairline py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center lg:px-8">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="" className="size-7 rounded-lg object-cover" />
          <span className="font-display text-sm font-semibold">slang</span>
        </div>

        <p className="text-sm text-muted-foreground">
          Customer communication platform. {new Date().getFullYear()} Slang.
        </p>

        <ul className="flex items-center gap-4">
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-muted-foreground transition-colors hover:text-violet"
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
