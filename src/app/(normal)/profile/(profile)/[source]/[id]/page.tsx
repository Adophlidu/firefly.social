import type { Metadata } from 'next';

import { KeyType, type ProfileSourceInURL } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { createMetadataProfileById } from '@/helpers/createMetadataProfileById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/utility.js';

const createPageMetadata = memoizeWithRedis(createMetadataProfileById, {
    key: KeyType.CreateMetadataProfileById,
});

type Props = NextPageProps<{ source: ProfileSourceInURL; id: string }>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id } = await props.params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (resolvedSource && isProfilePageSource(resolvedSource))
        return createPageMetadata(`/profile/${resolvedSource}/${id}`, resolvedSource, id, true);
    return createSiteMetadata(`/profile/${resolvedSource}/${id}`);
}

export default async function Page(props: Props) {
    const { source, id } = await props.params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isProfilePageSource(resolvedSource)) notFound();
    redirect(getProfileUrl({ source: resolvedSource, profileId: id, handle: id }), RedirectType.replace);
}
