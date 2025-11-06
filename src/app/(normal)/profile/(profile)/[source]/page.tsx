import { RedirectProfilePage } from '@/app/(normal)/profile/pages/RedirectProfilePage.js';
import { RedirectWithFireflyUID } from '@/app/(normal)/profile/pages/RedirectWithFireflyUID.js';
import { notFound } from '@/esm/navigation.js';
import { isNumericalProfileId as isUID } from '@/helpers/isNumericalProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { createFireflyProfileMetadata } from '@/providers/firefly/metadatas/createFireflyProfileMetadata.js';
import type { NextPageProps } from '@/types/utility.js';

export async function generateMetadata(props: Props) {
    const { source } = await props.params;
    return createFireflyProfileMetadata(source, `/profile/${source}`);
}

interface Props extends NextPageProps<{ source: string }> {}

export default async function Page(props: Props) {
    const { source } = await props.params;
    if (isUID(source)) return <RedirectWithFireflyUID uid={source} />;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isSocialSource(resolvedSource)) notFound();
    return <RedirectProfilePage source={resolvedSource} />;
}
