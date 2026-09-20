export interface Shot {
  /** Path without an extension: `<src>.webp` is offered first, `<src>.png` is the fallback. */
  readonly src: string
  readonly width: number
  readonly height: number
  readonly alt: string
}

/**
 * An app screenshot. Explicit width and height reserve its space before it
 * loads. Below the fold it loads lazily; above it (`eager`) it loads at once
 * and is fetched first, since it is part of what the visitor sees first.
 */
export function Screenshot({ shot, eager = false }: { shot: Shot; eager?: boolean }) {
  return (
    <picture>
      <source type="image/webp" srcSet={`${shot.src}.webp`} />
      <img
        src={`${shot.src}.png`}
        width={shot.width}
        height={shot.height}
        alt={shot.alt}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        className="block h-auto w-full"
      />
    </picture>
  )
}
