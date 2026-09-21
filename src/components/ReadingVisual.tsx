import { Screenshot, type Shot } from './Screenshot.tsx'

/**
 * The same book open on a desktop and on a phone. Side by side from 640px; on a
 * phone the desktop view takes the full width and the phone overlaps its lower
 * corner, so both stay large enough to read.
 */
export function ReadingVisual({ desktop, phone }: { desktop: Shot; phone: Shot }) {
  return (
    <div
      data-visual="devices"
      className="flex flex-col items-stretch sm:flex-row sm:items-end sm:justify-center sm:gap-4"
    >
      <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface shadow-lift sm:flex-1">
        <Screenshot shot={desktop} />
      </div>
      <div className="-mt-16 mr-3 w-[40%] min-w-[110px] flex-none self-end overflow-hidden rounded-2xl border border-line bg-surface shadow-lift sm:mt-0 sm:mr-0 sm:w-[26%] sm:min-w-[84px]">
        <Screenshot shot={phone} />
      </div>
    </div>
  )
}
