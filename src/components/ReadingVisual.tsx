import type { Site } from '../content/site.ts'

function Progress() {
  return (
    <div className="h-[3px] overflow-hidden rounded-sm bg-line">
      <div className="h-full w-[41%] bg-warm" />
    </div>
  )
}

/** The same passage on a desktop and on a phone, at the same reading position. */
export function ReadingVisual({ devices }: { devices: Site['features']['devices'] }) {
  return (
    <div data-visual="devices" className="flex justify-center gap-4">
      <div className="w-[200px] rounded-xl border border-line bg-surface p-4 shadow-lift">
        <div className="mb-2 font-mono text-[9px] tracking-[0.08em] text-ink-2">
          {devices.desktopLabel}
        </div>
        <div className="font-serif text-[15px] leading-[1.4]">{devices.desktopExcerpt}</div>
        <div className="mt-3.5">
          <Progress />
        </div>
      </div>
      <div className="w-[120px] self-end rounded-2xl border border-line bg-surface p-3.5 shadow-lift">
        <div className="mb-2 font-mono text-[8px] tracking-[0.08em] text-ink-2">
          {devices.phoneLabel}
        </div>
        <div className="font-serif text-xs leading-[1.4]">{devices.phoneExcerpt}</div>
        <div className="mt-3">
          <Progress />
        </div>
      </div>
    </div>
  )
}
