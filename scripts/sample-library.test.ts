// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

interface Sample {
  readerBook: { workIndex: number; title: string; paragraphs: string[] }
  works: Array<{ id: string; editionId: string; title: string; authors: string[] }>
}
const sample = JSON.parse(
  readFileSync(join(import.meta.dirname, 'sample-library.json'), 'utf8'),
) as Sample

describe('the screenshot sample library', () => {
  it('holds only public-domain titles', () => {
    // An allowlist, not a snapshot: adding a title means checking it is public domain.
    const publicDomain = new Set([
      'Middlemarch',
      'Frankenstein',
      'Moby-Dick',
      'Pride and Prejudice',
      'Walden',
      'Jane Eyre',
      'Great Expectations',
      'Dracula',
      'Wuthering Heights',
      'The Picture of Dorian Gray',
    ])
    expect(sample.works).toHaveLength(publicDomain.size)
    for (const { title } of sample.works) expect(publicDomain, title).toContain(title)
  })

  it('has unique ids and an author for every work', () => {
    expect(new Set(sample.works.map((w) => w.id)).size).toBe(sample.works.length)
    expect(new Set(sample.works.map((w) => w.editionId)).size).toBe(sample.works.length)
    for (const work of sample.works) expect(work.authors.length, work.title).toBeGreaterThan(0)
  })

  it('reads from a work that exists, and its text is the Moby-Dick opening', () => {
    const work = sample.works[sample.readerBook.workIndex]
    expect(work?.title).toBe(sample.readerBook.title)
    expect(sample.readerBook.paragraphs[0]).toMatch(/^Call me Ishmael\./)
  })
})
