import type { Site } from '../content/site.ts'
import { ConceptIcon } from './ConceptIcon.tsx'

export function Concepts({ concepts }: { concepts: Site['concepts'] }) {
  return (
    <section className="bg-surface-alt px-[clamp(20px,5vw,64px)] py-[clamp(56px,8vw,88px)]">
      <div className="mx-auto grid max-w-[1160px] grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {concepts.map((concept) => (
          <div
            key={concept.title}
            className="rounded-xl border border-line bg-surface p-7 shadow-card"
          >
            <ConceptIcon name={concept.icon} />
            <h2 className="mb-2 text-[17px] font-semibold tracking-[-0.01em]">{concept.title}</h2>
            <p className="text-[14.5px] text-ink-2">{concept.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
