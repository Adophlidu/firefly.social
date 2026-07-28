import { PageHeading } from '#/components/catalog/PageHeading.js';
import { CheckIcon, CloseIcon, CopyIcon, LeftArrowIcon, LoadingIcon } from '#/components/catalog/real-icons.js';
import { Section } from '#/components/catalog/Section.js';
import { Swatch } from '#/components/catalog/Swatch.js';

export default function ButtonsPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Buttons & Actions"
                description="Static style reference only — no click handlers or state are wired up here. Classes and icons are copied from ActionButton.tsx, IconButton.tsx, ClickableButton.tsx, RemoveButton.tsx, and CopyTextButton.tsx."
            />

            <Section title="Action Button" description="Full-width buttons used for primary flows and confirmations.">
                <Swatch label="primary">
                    <button className="rounded-full bg-main px-6 py-2 font-bold text-primaryBottom">Continue</button>
                </Swatch>
                <Swatch label="secondary">
                    <button className="rounded-full border border-main/40 px-6 py-2.5 text-sm font-bold leading-[18px] text-fourMain">
                        Cancel
                    </button>
                </Swatch>
                <Swatch label="danger">
                    <button className="rounded-full bg-commonDanger px-6 py-2 font-bold text-white">Delete</button>
                </Swatch>
                <Swatch label="disabled">
                    <button
                        disabled
                        className="cursor-not-allowed rounded-full bg-main px-6 py-2 font-bold text-primaryBottom opacity-50"
                    >
                        Continue
                    </button>
                </Swatch>
            </Section>

            <Section
                title="Icon Button"
                description="rounded p-1 hover:bg-lightBg — each carries a tooltip in production."
            >
                <Swatch label="default">
                    <button className="rounded p-1 hover:bg-lightBg" aria-label="Close">
                        <CloseIcon className="size-6 text-main" />
                    </button>
                </Swatch>
                <Swatch label="back">
                    <button className="rounded p-1 hover:bg-lightBg" aria-label="Back">
                        <LeftArrowIcon className="size-6 text-main" />
                    </button>
                </Swatch>
            </Section>

            <Section title="Clickable Button" description="Bare button primitive other buttons are built on top of.">
                <Swatch label="default">
                    <button className="rounded-lg border border-line px-4 py-2 text-sm font-medium">Action</button>
                </Swatch>
                <Swatch label="loading">
                    <button
                        disabled
                        className="flex items-center gap-1 rounded-lg border border-line px-4 py-2 text-sm font-medium opacity-50"
                    >
                        Action
                        <LoadingIcon className="size-5 animate-spin" />
                    </button>
                </Swatch>
                <Swatch label="disabled">
                    <button
                        disabled
                        className="cursor-not-allowed rounded-lg border border-line px-4 py-2 text-sm font-medium opacity-50"
                    >
                        Action
                    </button>
                </Swatch>
            </Section>

            <Section
                title="Copy Text Button"
                description="Toggles from the copy icon to a text-highlight check after copying."
            >
                <Swatch label="idle">
                    <button className="p-1" aria-label="Copy">
                        <CopyIcon className="size-3.5" />
                    </button>
                </Swatch>
                <Swatch label="copied">
                    <button className="p-1" aria-label="Copied">
                        <CheckIcon className="size-3.5 text-highlight" />
                    </button>
                </Swatch>
            </Section>

            <Section
                title="Remove Button"
                description="A CloseButton wrapped in a circular bg-gray-500 chip — shown on hover over removable items."
            >
                <Swatch label="default">
                    <button
                        className="inline-flex size-6 items-center justify-center rounded-full bg-gray-500"
                        aria-label="Remove"
                    >
                        <CloseIcon className="size-4 text-white" />
                    </button>
                </Swatch>
            </Section>
        </main>
    );
}
