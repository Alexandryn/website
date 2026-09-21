import { Screenshot, type Shot } from './Screenshot.tsx'

/**
 * The laptop-and-phone pair under the hero, showing the real library and
 * reader. The images carry alt text, so nothing here is hidden from
 * assistive technology.
 */
export function DeviceMockup({ library, phone }: { library: Shot; phone: Shot }) {
  return (
    <div
      data-device-mockup
      className="mx-auto mt-16 flex max-w-[1160px] flex-wrap items-end justify-center"
    >
      <div
        data-device="laptop"
        className="w-full max-w-[640px] flex-none md:w-[min(640px,calc(100%-88px))]"
      >
        <div className="rounded-[14px_14px_4px_4px] bg-ink px-2.5 pt-2.5 shadow-lift">
          <div className="overflow-hidden rounded-t-lg bg-paper">
            <Screenshot shot={library} eager />
          </div>
        </div>
        <div className="-mx-1.5 h-3.5 rounded-b-lg bg-linear-to-b from-ink to-black" />
      </div>

      <div
        data-device="phone"
        className="relative z-[2] -mt-24 mr-2 ml-auto w-[132px] flex-none md:mt-0 md:mr-[-14px] md:ml-[-30px]"
      >
        <div className="rounded-[22px] bg-ink p-2 shadow-lift">
          <div className="overflow-hidden rounded-2xl bg-paper">
            <Screenshot shot={phone} eager />
          </div>
        </div>
      </div>
    </div>
  )
}
