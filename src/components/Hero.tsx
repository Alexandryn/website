import type { Site } from '../content/site.ts'
import { DeviceMockup } from './DeviceMockup.tsx'

export function Hero({
  hero,
  screenshots,
}: {
  hero: Site['hero']
  screenshots: Site['screenshots']
}) {
  return (
    <section className="px-[clamp(20px,5vw,64px)] pt-[clamp(56px,9vw,104px)] pb-[clamp(48px,7vw,88px)]">
      <div className="mx-auto flex max-w-[1160px] flex-col items-center gap-[26px] text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 shadow-sm">
          <img
            src="alex.svg"
            alt=""
            aria-hidden="true"
            className="h-5 w-auto"
            width="20"
            height="23"
          />
          <span className="font-mono text-xs text-ink-2 tracking-[0.02em]">{hero.mascotLabel}</span>
        </div>
        <h1 className="max-w-[820px] font-serif text-[length:clamp(40px,6.4vw,68px)] leading-[1.08] font-medium tracking-[-0.02em]">
          {hero.headlineLead}
          <span className="relative inline-block">
            {hero.headlineEmphasis}
            <svg
              aria-hidden="true"
              width="100%"
              height="10"
              viewBox="0 0 220 10"
              preserveAspectRatio="none"
              className="absolute bottom-[-6px] left-0 w-full"
            >
              <path
                d="M2 6 Q 110 -2 218 6"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                className="stroke-warm"
              />
            </svg>
            {hero.headlineEnd}
          </span>
        </h1>
        <p className="max-w-[560px] text-[length:clamp(16px,1.6vw,19px)] text-ink-2">
          {hero.subline}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3">
          <a
            href={hero.primaryHref}
            className="inline-flex h-11 items-center rounded-[9px] bg-accent px-[22px] text-[15px] font-medium whitespace-nowrap text-on-accent hover:bg-accent-hover hover:no-underline"
          >
            {hero.primaryLabel}
          </a>
          <a
            href={hero.secondaryHref}
            className="inline-flex h-11 items-center rounded-[9px] border border-line bg-paper px-[22px] text-[15px] font-medium whitespace-nowrap text-accent hover:bg-surface hover:no-underline"
          >
            {hero.secondaryLabel}
          </a>
        </div>
        <p className="mt-0.5 font-mono text-xs tracking-[0.03em] text-ink-2">{hero.footnote}</p>
      </div>
      <DeviceMockup library={screenshots.library} phone={screenshots.readerPhone} />
    </section>
  )
}
