import { useSyncExternalStore } from 'react'
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

export function Nav({ name, nav }: { name: string; nav: Site['nav'] }) {
  const scrolled = useScrolled()
  return (
    <header
      className={`sticky top-0 z-50 border-b bg-paper transition-colors duration-200 motion-reduce:transition-none ${
        scrolled ? 'border-line' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-[18px] px-[clamp(20px,5vw,64px)] py-3.5">
        <span className="text-[17px] font-semibold tracking-[-0.01em]">{name}</span>
        <div className="flex-1" />
        <nav aria-label={nav.ariaLabel} className="flex flex-wrap items-center gap-[26px]">
          {nav.links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-ink-2">
              {link.label}
            </a>
          ))}
          <a
            href={nav.downloadHref}
            className="inline-flex h-9 items-center rounded-lg bg-accent px-[18px] text-sm font-medium text-on-accent hover:bg-accent-hover hover:no-underline"
          >
            {nav.downloadLabel}
          </a>
        </nav>
      </div>
    </header>
  )
}
