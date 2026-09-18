/** A house with a padlock on it: your library, kept at home. Decorative. */
export function PrivacyVisual() {
  return (
    <div data-visual="privacy" className="flex justify-center">
      <div className="grid size-24 place-items-center rounded-full bg-accent-soft">
        <svg viewBox="0 0 56 56" width="56" height="56" fill="none">
          <path d="M28 6 46 22H10z" className="fill-accent" />
          <rect x="12" y="22" width="32" height="24" rx="2" className="fill-accent" />
          <rect
            x="22"
            y="31"
            width="12"
            height="11"
            rx="2.5"
            strokeWidth="2"
            className="fill-warm stroke-surface"
          />
          <path
            d="M25 31v-3a3 3 0 0 1 6 0v3"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-surface"
          />
        </svg>
      </div>
    </div>
  )
}
