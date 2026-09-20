import { Screenshot, type Shot } from './Screenshot.tsx'

export function LibraryVisual({ shot }: { shot: Shot }) {
  return (
    <div
      data-visual="library"
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
    >
      <Screenshot shot={shot} />
    </div>
  )
}
