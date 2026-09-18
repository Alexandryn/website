export type Cover = { title: string; bg: string; fg: string }
type Size = 'hero' | 'feature' | 'phone'

// The phone covers are too small to carry a title, as in the prototype.
const SIZES: Record<Size, { spine: string; title: string | null }> = {
  hero: { spine: 'w-1', title: 'top-[9px] right-[7px] left-[9px] text-[10px]' },
  feature: { spine: 'w-[3px]', title: 'top-2 right-1.5 left-2 text-[9px]' },
  phone: { spine: 'w-[3px]', title: null },
}

/** A drawn book cover. Decorative: it always sits inside an aria-hidden mockup. */
export function BookCover({ book, size }: { book: Cover; size: Size }) {
  const { spine, title } = SIZES[size]
  return (
    <div
      data-cover
      className={`relative aspect-[2/3] overflow-hidden rounded-[3px] ${size === 'phone' ? '' : 'shadow-card'}`}
      style={{ backgroundColor: book.bg, color: book.fg }}
    >
      <div className={`absolute top-0 bottom-0 left-0 bg-black/22 ${spine}`} />
      {title && (
        <div className={`absolute hidden font-serif leading-[1.15] min-[480px]:block ${title}`}>
          {book.title}
        </div>
      )}
    </div>
  )
}
