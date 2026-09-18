import { Fragment } from 'react'
import type { Site } from '../content/site.ts'

// Break opportunities after a slash (but not between the two in "https://"),
// so a narrow screen wraps a URL at its path segments instead of mid-word.
const afterSlash = (text: string) => text.split(/(?<=\/)(?!\/)/)

/**
 * A terminal window showing how to clone the repository. The `$` prompt is
 * drawn with CSS on the command line only, so it is not part of the copied
 * text and the licence caption below is never mistaken for shell input.
 */
export function TerminalPanel({ openSource }: { openSource: Site['features']['openSource'] }) {
  return (
    <div
      data-visual="terminal"
      className="mx-auto w-[min(320px,100%)] rounded-[10px] bg-ink px-5 py-[18px] shadow-lift"
    >
      <div className="mb-3 flex gap-1.5">
        <div className="size-2 rounded-full bg-surface/25" />
        <div className="size-2 rounded-full bg-surface/25" />
        <div className="size-2 rounded-full bg-surface/25" />
      </div>
      <div className="font-mono text-xs leading-[1.7] text-terminal-text">
        <div
          data-terminal-line="command"
          className="before:text-terminal-prompt before:content-['$_']"
        >
          {afterSlash(openSource.terminalCommand).map((part, i) => (
            <Fragment key={part}>
              {i > 0 && <wbr />}
              {part}
            </Fragment>
          ))}
        </div>
        <div data-terminal-line="caption">{openSource.terminalCaption}</div>
        <div data-terminal-line="note" className="text-terminal-muted">
          {openSource.terminalNote}
        </div>
      </div>
    </div>
  )
}
