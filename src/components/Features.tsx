import type { Site } from '../content/site.ts'
import { FeatureRow } from './FeatureRow.tsx'
import { LibraryVisual } from './LibraryVisual.tsx'
import { PrivacyVisual } from './PrivacyVisual.tsx'
import { ReadingVisual } from './ReadingVisual.tsx'
import { TerminalPanel } from './TerminalPanel.tsx'

export function Features({
  features,
  books,
}: {
  features: Site['features']
  books: Site['books']
}) {
  return (
    <section className="px-[clamp(20px,5vw,64px)] pt-[clamp(40px,6vw,64px)] pb-[clamp(56px,8vw,88px)]">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-[clamp(56px,7vw,84px)]">
        <FeatureRow
          title={features.library.title}
          body={features.library.body}
          visual={<LibraryVisual library={features.library} books={books} />}
        />
        <FeatureRow
          title={features.devices.title}
          body={features.devices.body}
          visual={<ReadingVisual devices={features.devices} />}
          visualFirst
        />
        <FeatureRow
          title={features.privacy.title}
          body={features.privacy.body}
          visual={<PrivacyVisual />}
        />
        <FeatureRow
          title={features.openSource.title}
          body={features.openSource.body}
          visual={<TerminalPanel openSource={features.openSource} />}
          visualFirst
          decorative={false}
        />
      </div>
    </section>
  )
}
