import QRCode from 'react-qr-code';

import { PageHeading } from '#/components/catalog/PageHeading.js';
import { Section } from '#/components/catalog/Section.js';
import { Swatch } from '#/components/catalog/Swatch.js';

export default function MediaIconsPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Media & Icons"
                description="Static style reference only. Avatar/TokenIcon/ChainIcon are remote-image components with no fixed visual identity, so their real fallback/container classes are shown against a neutral circle rather than an invented image. SocialSourceIcon renders the real platform SVG marks from packages/assets."
            />

            <Section
                title="Avatar"
                description="rounded-full bg-secondary object-cover — bg-secondary is the real fallback background."
            >
                <Swatch label="24px">
                    <span className="block size-6 rounded-full bg-secondary" />
                </Swatch>
                <Swatch label="40px">
                    <span className="block size-10 rounded-full bg-secondary" />
                </Swatch>
                <Swatch label="64px">
                    <span className="block size-16 rounded-full bg-secondary" />
                </Swatch>
            </Section>

            <Section
                title="Avatar Group"
                description="relative inline-flex items-center, -ml-2.5 overlap from the second avatar on."
            >
                <div className="flex items-center">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{ zIndex: 3 - i }}
                            className={`size-10 rounded-full border-2 border-primaryBottom bg-secondary ${i > 0 ? '-ml-2.5' : ''}`}
                        />
                    ))}
                </div>
            </Section>

            <Section
                title="Token Icon"
                description="Real fallback state when the remote logo fails to load: bg-main text-primaryBottom with the token's first letter, plus a bg-white chain badge."
            >
                <div className="relative inline-block">
                    <span className="flex size-8 items-center justify-center rounded-full bg-main text-sm font-semibold text-primaryBottom">
                        E
                    </span>
                    <span className="absolute -bottom-px -right-1.5 overflow-hidden rounded-full bg-white p-px">
                        <span className="block size-3 rounded-full bg-link" />
                    </span>
                </div>
            </Section>

            <Section title="Chain Icon" description="Remote-image, rounded-full — no fixed fallback style of its own.">
                <span className="bg-secondary/40 block size-6 rounded-full" />
            </Section>

            <Section title="Social Source Icon" description="Real per-platform SVG marks from packages/assets.">
                <Swatch label="Lens">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/lens.svg" alt="Lens" width={24} height={24} />
                </Swatch>
                <Swatch label="Farcaster">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/farcaster.svg" alt="Farcaster" width={24} height={24} />
                </Swatch>
                <Swatch label="Twitter / X">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/x-circle-light.svg" alt="Twitter / X" width={24} height={24} />
                </Swatch>
                <Swatch label="Bluesky">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/bsky-circle.svg" alt="Bluesky" width={24} height={24} />
                </Swatch>
            </Section>

            <Section
                title="Scannable QR Code"
                description="rounded-2xl bg-white p-4, using the real react-qr-code renderer."
            >
                <div className="rounded-2xl bg-white p-4">
                    <QRCode value="https://firefly.social" size={160} />
                </div>
            </Section>
        </main>
    );
}
