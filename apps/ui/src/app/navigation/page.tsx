import { PageHeading } from '#/components/catalog/PageHeading.js';
import { Section } from '#/components/catalog/Section.js';

export default function NavigationPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Navigation"
                description="Static style reference only — tabs below don't switch on click. Classes are copied verbatim from each Tab variant in Tabs/index.tsx."
            />

            <Section
                title="Tabs — default"
                description="Active: border-farcasterPrimary text-main. Inactive: border-transparent text-third."
            >
                <nav className="flex gap-4">
                    <span className="border-b-2 border-farcasterPrimary px-4 pb-2 font-bold text-main">Posts</span>
                    <span className="border-b-2 border-transparent px-4 pb-2 font-bold text-third">Replies</span>
                    <span className="border-b-2 border-transparent px-4 pb-2 font-bold text-third">Media</span>
                </nav>
            </Section>

            <Section title="Tabs — solid" description="Active: bg-bg text-highlight. Inactive: text-second.">
                <nav className="inline-flex gap-0 rounded-[4px] p-[6px] text-sm">
                    <span className="rounded-[4px] bg-bg px-3 py-1.5 text-highlight">Day</span>
                    <span className="px-3 py-1.5 text-second">Week</span>
                    <span className="px-3 py-1.5 text-second">Month</span>
                </nav>
            </Section>

            <Section
                title="Tabs — subtle"
                description="Active: border-secondaryLine bg-bg text-main. Inactive: border-transparent text-third."
            >
                <nav className="flex gap-2 text-sm">
                    <span className="rounded-full border border-secondaryLine bg-bg px-4 py-1.5 text-main">All</span>
                    <span className="rounded-full border border-transparent px-4 py-1.5 text-third">Following</span>
                    <span className="rounded-full border border-transparent px-4 py-1.5 text-third">Trending</span>
                </nav>
            </Section>

            <Section
                title="Tabs — main"
                description="Active: border-highlight text-highlight. Inactive: border-transparent text-third."
            >
                <nav className="flex gap-6 text-base font-bold">
                    <span className="border-b-4 border-highlight pb-2 text-highlight">Home</span>
                    <span className="border-b-4 border-transparent pb-2 text-third">Explore</span>
                    <span className="border-b-4 border-transparent pb-2 text-third">Notifications</span>
                </nav>
            </Section>

            <Section
                title="Footnote Link"
                description="text-sm text-secondary hover:underline — shown under embedded content."
            >
                <span className="text-sm text-secondary hover:underline">firefly.social</span>
            </Section>

            <p className="text-sm text-second">
                <span className="font-medium text-main">ElementAnchor</span> is a behavior-only infinite-scroll sentinel
                (an invisible intersection-observer trigger) — it has no visual style, so it's out of scope for this
                catalog.
            </p>
        </main>
    );
}
