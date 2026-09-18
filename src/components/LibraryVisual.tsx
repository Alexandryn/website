import type { Site } from '../content/site.ts'
import { BookCover } from './BookCover.tsx'

export function LibraryVisual({
  library,
  books,
}: {
  library: Site['features']['library']
  books: Site['books']
}) {
  return (
    <div
      data-visual="library"
      className="overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-lift"
    >
      <div className="mb-3 flex items-center gap-2">
        {[library.filterLabel, library.sortLabel].map((label) => (
          <div
            key={label}
            className="flex h-[22px] items-center rounded-md border border-line px-[9px] text-[11px] text-ink-2"
          >
            {label}
          </div>
        ))}
        <div className="flex-1" />
        <div className="font-mono text-[10px] text-ink-2">{library.countLabel}</div>
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {books.map((book) => (
          <BookCover key={book.title} book={book} size="feature" />
        ))}
      </div>
    </div>
  )
}
