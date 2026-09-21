import type { Site } from '../content/site.ts'

export function Download({
  id,
  download,
  links,
}: {
  id: string
  download: Site['download']
  links: Site['links']
}) {
  return (
    <section
      id={id}
      className="border-y border-line bg-surface px-[clamp(20px,5vw,64px)] py-[clamp(64px,9vw,104px)]"
    >
      <div className="mx-auto max-w-[640px] text-center">
        <p className="mb-3.5 font-mono text-[11.5px] tracking-[0.16em] text-ink-2">
          {download.eyebrow}
        </p>
        <h2 className="mb-[30px] font-serif text-[length:clamp(28px,3.6vw,38px)] font-medium tracking-[-0.01em]">
          {download.heading}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {download.platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              className="inline-flex h-11 items-center rounded-[9px] bg-accent px-5 text-[14.5px] font-medium whitespace-nowrap text-on-accent hover:bg-accent-hover hover:no-underline"
            >
              {platform.label}
            </a>
          ))}
        </div>
        <p className="mt-5 font-mono text-xs text-ink-2">
          {download.versionLabel} ·{' '}
          <a href={links.changelogUrl} className="text-ink-2 underline">
            {download.changelogLabel}
          </a>
        </p>
        <p className="mt-3.5 text-sm text-ink-2">{download.platformNote}</p>
        <p className="mt-3.5 text-sm text-ink-2">{download.signingNote}</p>
        <p className="mt-3.5 text-sm text-ink-2">
          {download.dockerLead}
          <a href={download.dockerHref} className="underline underline-offset-3">
            {download.dockerLinkLabel}
          </a>
        </p>
      </div>
    </section>
  )
}
