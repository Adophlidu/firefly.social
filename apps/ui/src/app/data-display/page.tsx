import { PageHeading } from '#/components/catalog/PageHeading.js';
import { VerifyIcon } from '#/components/catalog/real-icons.js';
import { Section } from '#/components/catalog/Section.js';
import { Swatch } from '#/components/catalog/Swatch.js';

export default function DataDisplayPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Data Display"
                description="Static style reference only — no live pricing or formatting logic wired up. Classes and icons are copied from TokenValue.tsx, Code.tsx, ProfileVerifyBadge/index.tsx, and DefiUnitedBadge/index.tsx."
            />

            <Section
                title="Token Value"
                description="strong.text-2xl.font-bold amount, TokenIcon, and a text-gray-500 USD estimate."
            >
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                        <strong className="text-2xl font-bold">120.5</strong>
                        <span className="bg-secondary/30 size-6 rounded-full" aria-hidden />
                    </div>
                    <div className="text-sm text-gray-500">≈ $240.32</div>
                </div>
            </Section>

            <Section title="Code" description="rounded-lg bg-gray-300 dark:bg-gray-700 px-[5px] py-[2px] text-sm.">
                <code className="rounded-lg bg-gray-300 px-[5px] py-[2px] text-sm dark:bg-gray-700">0x1a2b...9f3d</code>
            </Section>

            <Section
                title="Profile Verify Badge"
                description="verify.svg, colored per platform (text-[#FB3E5D] Lens / text-[#855DCD] Farcaster / text-twitterVerified)."
            >
                <Swatch label="Lens">
                    <VerifyIcon className="size-4 text-[#FB3E5D]" />
                </Swatch>
                <Swatch label="Farcaster">
                    <VerifyIcon className="size-4 text-[#855DCD]" />
                </Swatch>
                <Swatch label="Twitter / X">
                    <VerifyIcon className="size-4 text-twitterVerified" />
                </Swatch>
            </Section>

            <Section
                title="DeFiUnited Badge"
                description="bronze.svg / silver.svg / gold.svg, 15x15, shown next to a profile."
            >
                <Swatch label="bronze">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/defiunited/bronze.svg" alt="Bronze DeFiUnited badge" width={15} height={15} />
                </Swatch>
                <Swatch label="silver">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/defiunited/silver.svg" alt="Silver DeFiUnited badge" width={15} height={15} />
                </Swatch>
                <Swatch label="gold">
                    {/* eslint-disable-next-line @next/next/no-img-element -- real asset from packages/assets, no svgr loader in this app */}
                    <img src="/ui/icons/defiunited/gold.svg" alt="Gold DeFiUnited badge" width={15} height={15} />
                </Swatch>
            </Section>

            <p className="text-sm text-second">
                <span className="font-medium text-main">TimestampFormatter</span> and{' '}
                <span className="font-medium text-main">ShrankPrice</span> exist in the codebase but have no visual
                style of their own — they render plain text (a formatted date, or digits with a subscript exponent for
                very small decimals) that inherits whatever classes the caller applies, so there's nothing distinct to
                catalog here.
            </p>
        </main>
    );
}
