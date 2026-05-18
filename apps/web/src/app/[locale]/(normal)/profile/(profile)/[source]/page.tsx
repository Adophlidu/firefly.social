import { SourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

import { RedirectProfilePage } from '@/app/[locale]/(normal)/profile/pages/RedirectProfilePage.js';
import { RedirectWithFireflyUID } from '@/app/[locale]/(normal)/profile/pages/RedirectWithFireflyUID.js';

import { notFound } from '@/esm/navigation/server.js';
import { isNumericalProfileId as isUID } from '@/helpers/isNumericalProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { createFireflyProfileMetadata } from '@/providers/firefly/metadata/createFireflyProfileMetadata.js';

export function generateStaticParams() {
    return [
        SourceInURL.Farcaster,
        SourceInURL.Lens,
        SourceInURL.Twitter,
        SourceInURL.X,
        SourceInURL.Bsky,
        SourceInURL.Wallet,
        SourceInURL.WalletMix,
    ].map((source) => ({ source }));
}

export async function generateMetadata(props: Props) {
    const { source } = await props.params;
    return createFireflyProfileMetadata(source, `/profile/${source}`);
}

interface Props extends LayoutProps<{ source: string }> {}

export default async function Page(props: Props) {
    const { source } = await props.params;
    if (isUID(source)) return <RedirectWithFireflyUID uid={source} />;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isSocialSource(resolvedSource)) notFound();
    return <RedirectProfilePage source={resolvedSource} />;
}
