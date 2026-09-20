import { Screenshot, type Shot } from './Screenshot.tsx'

/** The same book open on a desktop and on a phone. */
export function ReadingVisual({ desktop, phone }: { desktop: Shot; phone: Shot }) {
  return (
    <div data-visual="devices" className="flex items-end justify-center gap-4">
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <Screenshot shot={desktop} />
      </div>
      <div className="w-[26%] min-w-[84px] flex-none overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <Screenshot shot={phone} />
      </div>
    </div>
  )
}
