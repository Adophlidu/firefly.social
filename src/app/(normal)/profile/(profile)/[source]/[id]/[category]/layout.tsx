import type { Metadata } from 'next';
import { notFound } from 'next/navigation.js';

import { ProfileCategoryTabs } from '@/app/(normal)/profile/pages/ProfileCategoryTabs.js';
import {
    KeyType,
    type ProfileCategory,
    SocialProfileCategory,
    type SocialSource,
    SourceInURL,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { createMetadataProfileById } from '@/helpers/createMetadataProfileById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSourceFromUrl, resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: SourceInURL }> {}

const createPageMetadata = memoizeWithRedis(createMetadataProfileById, {
    key: KeyType.CreateMetadataProfileById,
});

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (source && isProfilePageSource(source)) return createPageMetadata(source, params.id);
    return createSiteMetadata();
}

interface LayoutProps
    extends NextPageProps<{
        id: string;
        category: SocialProfileCategory | WalletProfileCategory;
        source: SourceInURL;
    }> {}

export default async function Layout(props: LayoutProps) {
    const params = await props.params;

    const id = params.id;
    const source = resolveSourceFromUrl(params.source);
    if (!source || isFollowCategory(params.category)) notFound();

    const identity = resolveSpecialProfileIdentity({ source, id });

    return (
        <>
            <ProfileCategoryTabs category={params.category} source={identity.source as SocialSource} id={identity.id} />
            {props.children}
        </>
    );
}
