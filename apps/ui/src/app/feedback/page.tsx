import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

import { PageHeading } from '#/components/catalog/PageHeading.js';
import { GhostIcon, LoadingIcon, RadioDisableNoIcon, RadioYesIcon } from '#/components/catalog/real-icons.js';
import { Section } from '#/components/catalog/Section.js';
import { Swatch } from '#/components/catalog/Swatch.js';

export default function FeedbackPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Feedback"
                description="Static style reference only — no timers, dismissal, or fetching wired up. Classes and icons are copied from Loading.tsx, LoadingIcon.tsx, Snackbar.tsx, NoResultsFallback.tsx, and CircleCheckboxIcon.tsx."
            />

            <Section
                title="Loading"
                description="loading.svg with animate-spin, used inline and as a full-panel loading state."
            >
                <Swatch label="small">
                    <LoadingIcon className="size-4 animate-spin" />
                </Swatch>
                <Swatch label="default (24px)">
                    <LoadingIcon className="size-6 animate-spin" />
                </Swatch>
                <Swatch label="panel">
                    <div className="flex h-24 w-40 items-center justify-center rounded-xl border border-line">
                        <LoadingIcon className="size-6 animate-spin" />
                    </div>
                </Swatch>
            </Section>

            <Section
                title="Snackbar"
                description="Solid rounded-lg pill, shadow-lg, min-w-[300px] — variantClasses from Snackbar.tsx."
            >
                <Swatch label="success (bg-success)">
                    <div className="flex min-w-[280px] items-center gap-3 rounded-lg bg-success px-4 py-3 text-sm text-white shadow-lg">
                        <CheckCircleIcon className="size-6" />
                        Changes saved
                    </div>
                </Swatch>
                <Swatch label="error (bg-commonDanger)">
                    <div className="flex min-w-[280px] items-center gap-3 rounded-lg bg-commonDanger px-4 py-3 text-sm text-white shadow-lg">
                        <XCircleIcon className="size-6" />
                        Something went wrong
                    </div>
                </Swatch>
                <Swatch label="warning (bg-commonWarn)">
                    <div className="flex min-w-[280px] items-center gap-3 rounded-lg bg-commonWarn px-4 py-3 text-sm text-white shadow-lg">
                        <ExclamationCircleIcon className="size-6" />
                        Check your connection
                    </div>
                </Swatch>
            </Section>

            <Section
                title="No Results Fallback"
                description="ghost.svg (text-third) + text-medium font-bold message — shown when a list has nothing to display."
            >
                <div className="flex flex-col items-center py-8 text-secondary">
                    <GhostIcon className="h-[71px] w-[100px] text-third" />
                    <p className="mt-3 text-center text-medium font-bold">There is no data available for display.</p>
                </div>
            </Section>

            <Section
                title="Circle Checkbox"
                description="radio.yes.svg (text-highlight) / radio.disable-no.svg (text-secondaryLine)."
            >
                <Swatch label="checked">
                    <RadioYesIcon className="size-5 text-highlight" />
                </Swatch>
                <Swatch label="unchecked">
                    <RadioDisableNoIcon className="size-5 text-secondaryLine" />
                </Swatch>
            </Section>
        </main>
    );
}
