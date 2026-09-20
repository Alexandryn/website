import { BookCover, type Cover } from './BookCover.tsx'

/**
 * The laptop-and-phone illustration under the hero. Pure decoration: it is
 * hidden from assistive technology, because the covers are drawn, not real.
 */
export function DeviceMockup({
  books,
  networkLabel,
}: {
  books: readonly Cover[]
  networkLabel: string
}) {
  return (
    <div
      aria-hidden="true"
      data-device-mockup
      className="mx-auto mt-16 flex max-w-[1160px] flex-wrap items-end justify-center"
    >
      <div
        data-device="laptop"
        className="w-full max-w-[640px] flex-none md:w-[min(640px,calc(100%-88px))]"
      >
        <div className="rounded-[14px_14px_4px_4px] bg-ink px-2.5 pt-2.5 shadow-lift">
          <div className="overflow-hidden rounded-t-lg bg-paper">
            <div className="flex items-center gap-2 border-b border-line px-3.5 py-[9px]">
              <div className="size-1.5 rounded-full bg-line" />
              <div className="size-1.5 rounded-full bg-line" />
              <div className="size-1.5 rounded-full bg-line" />
              <div className="flex flex-1 justify-center">
                <div className="h-4 w-[44%] rounded-[5px] border border-line bg-surface" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 px-[18px] pt-4 pb-5">
              {books.slice(0, 8).map((book) => (
                <BookCover key={book.title} book={book} size="hero" />
              ))}
            </div>
          </div>
        </div>
        <div className="-mx-1.5 h-3.5 rounded-b-lg bg-linear-to-b from-ink to-black" />
      </div>

      <div data-device="phone" className="relative z-[2] -mr-3.5 -ml-[30px] w-[132px] flex-none">
        <div className="rounded-[22px] bg-ink p-2 shadow-lift">
          <div className="overflow-hidden rounded-2xl bg-paper">
            <div className="flex items-center justify-center pt-2 pb-1.5">
              <div className="h-1 w-7 rounded-sm bg-line" />
            </div>
            <div className="flex items-center gap-[5px] px-2.5 pb-2">
              <div className="size-[5px] rounded-full bg-ok" />
              <div className="font-mono text-[7px] tracking-[0.06em] text-ink-2">
                {networkLabel}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2.5 pb-3.5">
              {books.slice(0, 4).map((book) => (
                <BookCover key={book.title} book={book} size="phone" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
