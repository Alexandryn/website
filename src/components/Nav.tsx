import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { Site } from '../content/site.ts'

const SCROLLED_AFTER_PX = 4

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

// A store rather than state-in-an-effect: it is correct on the server (no
// window, so "not scrolled") and on hydration without a flash of wrong state.
function useScrolled() {
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > SCROLLED_AFTER_PX,
    () => false,
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />}
    </svg>
  )
}

/**
 * The page header. One row at every width: the wordmark, the Download button,
 * and either the links (from 640px) or a menu button that opens them below the
 * header. The links are one list in the DOM, so a screen reader and the tab
 * order never meet them twice.
 */
export function Nav({ name, nav }: { name: string; nav: Site['nav'] }) {
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: Event) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <header
      ref={headerRef}
      data-scrolled={scrolled}
      className={`sticky top-0 z-50 border-b bg-paper px-[clamp(20px,5vw,64px)] transition-colors duration-200 motion-reduce:transition-none ${
        scrolled || open ? 'border-line' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1160px] items-center gap-3 py-2 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src="alex.svg"
            alt=""
            aria-hidden="true"
            className="h-6 w-auto"
            width="24"
            height="28"
          />
          <span className="text-[17px] font-semibold tracking-[-0.01em]">{name}</span>
        </div>
        <div className="flex-1" />
        <nav aria-label={nav.ariaLabel} className="flex items-center gap-2 sm:gap-[26px]">
          <button
            ref={buttonRef}
            type="button"
            aria-label={nav.menuLabel}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-ink hover:bg-surface sm:hidden"
          >
            <MenuIcon open={open} />
          </button>
          <ul
            id={menuId}
            className={`absolute inset-x-0 top-full flex-col border-b border-line bg-paper px-[clamp(20px,5vw,64px)] pb-2 sm:static sm:flex sm:flex-row sm:items-center sm:gap-[26px] sm:border-0 sm:bg-transparent sm:p-0 ${
              open ? 'flex' : 'hidden'
            }`}
          >
            {nav.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center text-[15px] text-ink-2 sm:inline-flex sm:min-h-8 sm:text-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={nav.downloadHref}
            className="inline-flex h-11 items-center rounded-lg bg-accent px-[18px] text-sm font-medium text-on-accent hover:bg-accent-hover hover:no-underline sm:h-9"
          >
            {nav.downloadLabel}
          </a>
        </nav>
      </div>
    </header>
  )
}
