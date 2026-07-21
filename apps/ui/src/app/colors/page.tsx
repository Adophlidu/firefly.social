import { PageHeading } from '#/components/catalog/PageHeading.js';

import { ColorSwatch } from './ColorSwatch.js';

export default function ColorsPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Colors"
                description="The exact Tailwind color tokens defined in apps/web/tailwind.config.cjs (same CSS variables, same values) — not an invented palette. The ×N badge is how many bg-/text-/border-/etc. utility occurrences of that token were found in apps/web/src, kept here as the standardization evidence."
            />

            <section className="mb-14">
                <h2 className="text-lg font-semibold">Text</h2>
                <p className="mt-1 text-sm text-second">Text color hierarchy, most to least prominent.</p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <ColorSwatch
                        name="main"
                        className="bg-main"
                        cssVar="--color-main"
                        usage="Primary text"
                        count={622}
                    />
                    <ColorSwatch
                        name="second"
                        className="bg-second"
                        cssVar="--color-second"
                        usage="Secondary text"
                        count={385}
                    />
                    <ColorSwatch
                        name="secondary"
                        className="bg-secondary"
                        cssVar="--color-secondary"
                        usage="Meta / caption text"
                        count={198}
                    />
                    <ColorSwatch
                        name="lightMain"
                        className="bg-lightMain"
                        cssVar="--color-light-main"
                        usage="Inverted text"
                        count={148}
                    />
                    <ColorSwatch
                        name="third"
                        className="bg-third"
                        cssVar="--color-third"
                        usage="Muted text"
                        count={76}
                    />
                    <ColorSwatch
                        name="fourMain"
                        className="bg-fourMain"
                        cssVar="--color-main4"
                        usage="Secondary-button label"
                        count={12}
                    />
                </div>
            </section>

            <section className="mb-14">
                <h2 className="text-lg font-semibold">Surfaces</h2>
                <p className="mt-1 text-sm text-second">Page, card, and panel backgrounds.</p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <ColorSwatch
                        name="primaryBottom"
                        className="bg-primaryBottom"
                        cssVar="--color-bottom"
                        usage="Page / panel background"
                        count={215}
                    />
                    <ColorSwatch
                        name="bg"
                        className="bg-bg"
                        cssVar="--color-bg"
                        usage="Card / surface tint"
                        count={238}
                    />
                    <ColorSwatch
                        name="lightBg"
                        className="bg-lightBg"
                        cssVar="--color-light-bg"
                        usage="Hover surface tint"
                        count={109}
                    />
                    <ColorSwatch
                        name="input"
                        className="bg-input"
                        cssVar="--color-input"
                        usage="Input background"
                        count={13}
                    />
                    <ColorSwatch
                        name="thirdMain"
                        className="bg-thirdMain"
                        cssVar="--color-main3"
                        usage="Subtle surface tint"
                        count={9}
                    />
                    <ColorSwatch
                        name="darkBottom"
                        className="bg-darkBottom"
                        cssVar="--color-dark-bottom"
                        usage="Fixed-dark surface"
                        count={56}
                    />
                    <ColorSwatch
                        name="lightBottom"
                        className="bg-lightBottom"
                        cssVar="--m-light-bottom"
                        usage="Fixed-light surface"
                        count={58}
                    />
                </div>
            </section>

            <section className="mb-14">
                <h2 className="text-lg font-semibold">Borders</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <ColorSwatch
                        name="line"
                        className="bg-line"
                        cssVar="--color-line"
                        usage="Default border"
                        count={200}
                    />
                    <ColorSwatch
                        name="secondaryLine"
                        className="bg-secondaryLine"
                        cssVar="--color-line2"
                        usage="Stronger border"
                        count={66}
                    />
                </div>
            </section>

            <section className="mb-14">
                <h2 className="text-lg font-semibold">Accent</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <ColorSwatch
                        name="highlight"
                        className="bg-highlight"
                        cssVar="--color-highlight"
                        usage="Active / selected state"
                        count={242}
                    />
                    <ColorSwatch
                        name="lightHighlight"
                        className="bg-lightHighlight"
                        cssVar="--color-light-highlight"
                        usage="Highlight, inverted"
                        count={22}
                    />
                    <ColorSwatch
                        name="fireflyBrand"
                        className="bg-fireflyBrand"
                        cssVar="--color-firefly-brand"
                        usage="Firefly logo accent"
                        count={32}
                    />
                    <ColorSwatch name="link" className="bg-link" cssVar="--color-link" usage="Hyperlinks" count={32} />
                </div>
            </section>

            <section className="mb-14">
                <h2 className="text-lg font-semibold">Semantic</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <ColorSwatch
                        name="danger"
                        className="bg-danger"
                        cssVar="--color-danger"
                        usage="Errors, destructive"
                        count={124}
                    />
                    <ColorSwatch
                        name="commonDanger"
                        className="bg-commonDanger"
                        cssVar="--m-common-danger"
                        usage="Solid danger fill"
                        count={10}
                    />
                    <ColorSwatch name="warn" className="bg-warn" cssVar="--color-warn" usage="Warnings" count={21} />
                    <ColorSwatch
                        name="success"
                        className="bg-success"
                        cssVar="--color-success"
                        usage="Success states"
                        count={87}
                    />
                    <ColorSwatch
                        name="secondarySuccess"
                        className="bg-secondarySuccess"
                        cssVar="--color-secondary-success"
                        usage="Success, alt tone"
                        count={11}
                    />
                    <ColorSwatch
                        name="fail"
                        className="bg-fail"
                        cssVar="--color-fail"
                        usage="Form validation errors"
                        count={12}
                    />
                </div>
            </section>

            <section className="mb-14">
                <h2 className="text-lg font-semibold">Platform</h2>
                <p className="mt-1 text-sm text-second">
                    Brand colors for the social platforms Firefly aggregates. Defined in tailwind.config.cjs; mostly
                    consumed via real platform SVG marks (see Media &amp; Icons) rather than utility classes, so counts
                    are lower here.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <ColorSwatch
                        name="lensPrimary"
                        className="bg-lensPrimary"
                        cssVar="--color-lens-primary"
                        usage="Lens branding"
                        count={9}
                    />
                    <ColorSwatch
                        name="farcasterPrimary"
                        className="bg-farcasterPrimary"
                        cssVar="--color-farcaster-primary"
                        usage="Farcaster branding"
                        count={13}
                    />
                    <ColorSwatch
                        name="twitterPrimary"
                        className="bg-twitterPrimary"
                        cssVar="--color-twitter-primary"
                        usage="X branding"
                        count={0}
                    />
                    <ColorSwatch
                        name="bskyPrimary"
                        className="bg-bskyPrimary"
                        cssVar="--color-bsky-primary"
                        usage="Bluesky branding"
                        count={8}
                    />
                </div>
            </section>
        </main>
    );
}
