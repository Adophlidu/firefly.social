import { headers } from 'next/headers.js';
import { userAgentFromString } from 'next/server.js';

import { RedirectProfilePage } from '@/app/(normal)/profile/pages/RedirectProfilePage.js';
import { RedirectWithFireflyUID } from '@/app/(normal)/profile/pages/RedirectWithFireflyUID.js';
import { KeyType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { createMetadataProfileByFireflyUid } from '@/helpers/createMetadataProfileByFireflyUid.js';
import { isNumericalProfileId as isUID } from '@/helpers/isNumericalProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { FireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataProfileByFireflyUid, {
    key: KeyType.CreateMetadataProfileById,
});

export async function generateMetadata(props: Props) {
    const { source } = await props.params;
    return FireflyMetadataProvider.createFireflyProfileMetadata(source, `/profile/${source}`);
}

interface Props extends NextPageProps<{ source: string }> {}

export default async function Page(props: Props) {
    const { source } = await props.params;
    const headersList = await headers();
    const { isBot } = userAgentFromString(headersList.get('user-agent') || '');
    if (isBot) return null;
    if (isUID(source)) {
        return <RedirectWithFireflyUID uid={source} />;
    }
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isSocialSource(resolvedSource)) notFound();
    return <RedirectProfilePage source={resolvedSource} />;
}
