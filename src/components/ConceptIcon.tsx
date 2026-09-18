export type ConceptIconName = 'metadata' | 'sources' | 'library'

const SHAPES: Record<ConceptIconName, { viewBox: string; body: React.ReactNode }> = {
  // A card with three lines of text.
  metadata: {
    viewBox: '0 0 32 26',
    body: (
      <>
        <rect x="0.8" y="0.8" width="30.4" height="24.4" rx="3" />
        <path d="M6 6.8h20M6 12.8h20M6 18.8h16" />
      </>
    ),
  },
  // A folder.
  sources: {
    viewBox: '0 0 32 26',
    body: (
      <>
        <rect x="0.8" y="5.8" width="30.4" height="19.4" rx="2" />
        <path d="M2.4 5.8V1.6h11V5.8" />
      </>
    ),
  },
  // A house.
  library: {
    viewBox: '0 0 30 26',
    body: (
      <>
        <rect x="6.8" y="10.8" width="16.4" height="13.4" rx="2" />
        <path d="M15 1.8 24 10.8H6z" className="fill-accent" />
      </>
    ),
  },
}

/** Decorative: the card's title and text carry the meaning. */
export function ConceptIcon({ name }: { name: ConceptIconName }) {
  const { viewBox, body } = SHAPES[name]
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      width={viewBox.split(' ')[2]}
      height="26"
      fill="none"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className="mb-[18px] block stroke-accent"
    >
      {body}
    </svg>
  )
}
