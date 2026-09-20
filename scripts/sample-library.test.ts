// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { site } from '../src/content/site.ts'

interface Sample {
  readerBook: { workIndex: number; title: string; paragraphs: string[] }
  works: Array<{ id: string; editionId: string; title: string; authors: string[] }>
}
const sample = JSON.parse(
  readFileSync(join(import.meta.dirname, 'sample-library.json'), 'utf8'),
) as Sample

describe('the screenshot sample library', () => {
  it('holds exactly the public-domain titles the page draws, so the two agree', () => {
    expect(sample.works.map((w) => w.title).sort()).toEqual(site.books.map((b) => b.title).sort())
  })

  it('has unique ids, an author for every work, and the count the library view shows', () => {
    expect(new Set(sample.works.map((w) => w.id)).size).toBe(sample.works.length)
    expect(new Set(sample.works.map((w) => w.editionId)).size).toBe(sample.works.length)
    for (const work of sample.works) expect(work.authors.length, work.title).toBeGreaterThan(0)
    expect(site.features.library.countLabel).toBe(`${sample.works.length} BOOKS`)
  })

  it('reads from a work that exists, and its text is the Moby-Dick opening', () => {
    const work = sample.works[sample.readerBook.workIndex]
    expect(work?.title).toBe(sample.readerBook.title)
    expect(sample.readerBook.paragraphs[0]).toMatch(/^Call me Ishmael\./)
  })

  it('shows the same opening lines as the page mockup', () => {
    const text = sample.readerBook.paragraphs.join(' ')
    expect(text).toContain('having little or no money in my purse,')
  })
})
