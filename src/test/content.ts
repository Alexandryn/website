// Helpers shared by the content tests and the page-level tests, so the same
// forbidden-claim list guards both the data in site.ts and the rendered page.

export type Entry = { path: string; key: string; value: string }

/** Every string in `value`, with its dotted path and the last key of that path. */
export function collect(value: unknown, path = ''): Entry[] {
  if (typeof value === 'string') return [{ path, key: path.split('.').pop() ?? '', value }]
  if (Array.isArray(value)) return value.flatMap((item, i) => collect(item, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => collect(v, path ? `${path}.${k}` : k))
  }
  return []
}

// Claims the software cannot back up. Each was either in the prototype or is a
// natural way to reword a true statement into a false one.
export const FORBIDDEN: Array<[label: string, pattern: RegExp]> = [
  ['"no account" (Alexandryn has logins)', /\bno account\b|without an account/i],
  ['"nothing leaves your home" (Open Library lookups are outbound)', /nothing (ever )?leaves/i],
  [
    'a claim of no outside contact',
    /never (contacts?|phones?|calls?)|no outside (service|contact)/i,
  ],
  ['"no login" or an optional login', /no login|login (is )?optional|optional login/i],
  ['"TLS never needed"', /TLS (is )?(never|not) (needed|required)/i],
  ['"lock-in" marketing voice', /lock-in/i],
  ['the placeholder example.com', /example\.com/i],
  ['an exclamation mark', /!/],
]

/** The labels of every forbidden pattern that `text` matches. */
export function forbiddenIn(text: string): string[] {
  return FORBIDDEN.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
}
