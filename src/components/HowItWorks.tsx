import type { Site } from '../content/site.ts'

export function HowItWorks({ howItWorks }: { howItWorks: Site['howItWorks'] }) {
  return (
    <section className="px-[clamp(20px,5vw,64px)] py-[clamp(56px,8vw,88px)]">
      <div className="mx-auto max-w-[1160px]">
        <h2 className="mb-11 text-center font-serif text-[length:clamp(26px,3.2vw,34px)] font-medium tracking-[-0.01em]">
          {howItWorks.heading}
        </h2>
        {/* The dividers are borders on the items, so they disappear when the
            steps stack instead of being left as stray vertical lines. */}
        <ol className="m-0 flex list-none flex-wrap items-stretch gap-y-8 p-0">
          {howItWorks.steps.map((step) => (
            <li
              key={step.number}
              className="flex min-w-[200px] flex-1 flex-col gap-2.5 md:px-8 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-line"
            >
              <span className="font-mono text-[13px] tracking-[0.04em] text-accent">
                {step.number}
              </span>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{step.title}</h3>
              <p className="max-w-[280px] text-[14.5px] text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
