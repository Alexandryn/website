import type { Site } from '../content/site.ts'

export function Footer({ name, footer }: { name: string; footer: Site['footer'] }) {
  return (
    <footer className="px-[clamp(20px,5vw,64px)] pt-[clamp(48px,7vw,72px)] pb-7">
      <div className="mx-auto max-w-[1160px]">
        <div className="flex flex-wrap justify-between gap-8 pb-8">
          <div className="max-w-[320px]">
            <p className="mb-2 text-base font-semibold tracking-[-0.01em]">{name}</p>
            <p className="inline-flex min-h-8 items-center text-sm text-ink-2">
              {footer.description}
            </p>
          </div>
          <nav aria-label={footer.ariaLabel} className="flex flex-wrap gap-10">
            {footer.columns.map((column) => (
              <ul key={column.map((link) => link.label).join()} className="flex flex-col gap-2.5">
                {column.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-ink-2">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </nav>
        </div>
        <p className="border-t border-line pt-5 text-[11.5px] text-ink-2">{footer.licenseLine}</p>
      </div>
    </footer>
  )
}
