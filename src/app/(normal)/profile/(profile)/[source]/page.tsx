import { RedirectProfilePage } from '@/app/(normal)/profile/pages/RedirectProfilePage.js';
import { RedirectWithFireflyUID } from '@/app/(normal)/profile/pages/RedirectWithFireflyUID.js';
import { KeyType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { createMetadataProfileByFireflyUid } from '@/helpers/createMetadataProfileByFireflyUid.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isNumericalProfileId as isUID } from '@/helpers/isNumericalProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataProfileByFireflyUid, {
    key: KeyType.CreateMetadataProfileById,
});

export async function generateMetadata(props: Props) {
    const params = await props.params;
    if (isUID(params.source)) {
        return createPageMetadata(params.source);
    }
    return createSiteMetadata();
}

interface Props extends NextPageProps<{ source: string }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    if (isUID(params.source)) {
        return <RedirectWithFireflyUID uid={params.source} />;
    }
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source)) notFound();
    return <RedirectProfilePage source={source} />;
}
