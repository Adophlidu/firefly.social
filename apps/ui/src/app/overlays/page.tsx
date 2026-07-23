import { PageHeading } from '#/components/catalog/PageHeading.js';
import { CloseIcon } from '#/components/catalog/real-icons.js';
import { Section } from '#/components/catalog/Section.js';

export default function OverlaysPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Overlays"
                description="Shown inline as static previews of their 'open' state — no backdrop, focus trap, or dismiss behavior wired up. Classes are copied from Modal.tsx, Popover.tsx, Tooltip.tsx, and MenuGroup.tsx."
            />

            <Section
                title="Modal"
                description="Centered dialog, rounded-md md:rounded-xl bg-lightBottom dark:bg-darkBottom."
            >
                <div className="w-[355px] overflow-hidden rounded-xl border border-line bg-lightBottom dark:bg-darkBottom">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <span className="font-bold">Confirm action</span>
                        <CloseIcon className="size-5 text-second" />
                    </div>
                    <div className="p-4 text-sm text-second">
                        Are you sure you want to continue? This cannot be undone.
                    </div>
                </div>
            </Section>

            <Section
                title="Popover"
                description="Bottom sheet, rounded-2xl border border-line bg-primaryBottom, with a drag handle and scrollable body."
            >
                <div className="w-full max-w-[420px] rounded-2xl border border-line bg-primaryBottom p-3 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.04)] dark:shadow-[0px_8px_20px_0px_rgba(255,255,255,0.04)]">
                    <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-main" />
                    <div className="flex flex-col gap-2 p-2 text-sm">
                        <p className="font-medium">Select an option</p>
                        <p className="text-second">Sheet content scrolls independently of the page.</p>
                    </div>
                </div>
            </Section>

            <Section title="Tooltip" description="rounded-lg text-xs bg-gray-800, shown on hover with a delay.">
                <div className="relative inline-block pt-8">
                    <span className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs leading-6 tracking-wide text-white">
                        Helpful hint
                    </span>
                </div>
            </Section>

            <Section
                title="Menu Group"
                description="rounded-2xl border border-line bg-primaryBottom py-3, dropdown menu panel."
            >
                <div className="flex w-max flex-col gap-1 overflow-hidden rounded-2xl border border-line bg-primaryBottom py-3 text-base">
                    <div className="cursor-pointer px-4 py-2 hover:bg-lightBg">Edit</div>
                    <div className="cursor-pointer px-4 py-2 hover:bg-lightBg">Share</div>
                    <div className="cursor-pointer px-4 py-2 text-danger hover:bg-lightBg">Delete</div>
                </div>
            </Section>
        </main>
    );
}
