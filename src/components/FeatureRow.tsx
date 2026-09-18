import type { ReactNode } from 'react'

/**
 * One text-and-illustration row. With `visualFirst` the illustration comes
 * first in the DOM and the row wraps in reverse, so on a wide screen it sits
 * on the left and once the row wraps the text still comes first. The
 * illustration is decorative, so the order does not change what is announced.
 */
export function FeatureRow({
  title,
  body,
  visual,
  visualFirst = false,
}: {
  title: string
  body: string
  visual: ReactNode
  visualFirst?: boolean
}) {
  const illustration = (
    <div aria-hidden="true" data-feature-visual className="min-w-[280px] flex-1">
      {visual}
    </div>
  )
  return (
    <div
      data-feature-row
      className={`flex items-center gap-[clamp(28px,5vw,56px)] ${visualFirst ? 'flex-wrap-reverse' : 'flex-wrap'}`}
    >
      {visualFirst && illustration}
      <div className="min-w-[260px] flex-1">
        <h2 className="mb-2.5 text-[22px] font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="max-w-[400px] text-[15.5px] text-ink-2">{body}</p>
      </div>
      {!visualFirst && illustration}
    </div>
  )
}
