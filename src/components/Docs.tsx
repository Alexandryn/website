import type { Site } from '../content/site.ts'

export function Docs({ id, docs }: { id: string; docs: Site['docs'] }) {
  return (
    <section id={id} className="bg-surface-alt px-[clamp(20px,5vw,64px)] py-[clamp(56px,8vw,88px)]">
      <div className="mx-auto max-w-[1160px]">
        <h2 className="mb-9 text-center font-serif text-[length:clamp(26px,3.2vw,34px)] font-medium tracking-[-0.01em]">
          {docs.heading}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {docs.cards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="flex items-center gap-3.5 rounded-xl border border-line bg-surface px-[22px] py-5 text-ink shadow-card hover:no-underline"
            >
              <span className="min-w-0 flex-1">
                <span className="mb-1 block text-[15.5px] font-semibold tracking-[-0.01em]">
                  {card.title}
                </span>
                <span className="block text-[13.5px] text-ink-2">{card.body}</span>
              </span>
              <span
                aria-hidden="true"
                data-chevron
                className="size-2 flex-none rotate-45 border-t-[1.6px] border-r-[1.6px] border-ink-3"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
