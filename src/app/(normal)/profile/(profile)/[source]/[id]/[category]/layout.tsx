import type { Metadata } from 'next';

import { ProfileCategoryTabs } from '@/app/(normal)/profile/pages/ProfileCategoryTabs.js';
import {
    KeyType,
    type ProfileCategory,
    type ProfileSourceInURL,
    SocialProfileCategory,
    type SocialSource,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataProfileById } from '@/helpers/createMetadataProfileById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: ProfileSourceInURL }> {}

const createPageMetadata = memoizeWithRedis(createMetadataProfileById, {
    key: KeyType.CreateMetadataProfileById,
});

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (source && isProfilePageSource(source)) return createPageMetadata(source, params.id, true);
    return createSiteMetadata();
}

interface LayoutProps
    extends NextPageProps<{
        id: string;
        category: SocialProfileCategory | WalletProfileCategory;
        source: ProfileSourceInURL;
    }> {}

export default async function Layout(props: LayoutProps) {
    await setupLocaleForSSR();

    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || isFollowCategory(params.category)) notFound();

    const identity = resolveSpecialProfileIdentity({ source, id: params.id });

    return (
        <>
            <ProfileCategoryTabs category={params.category} source={identity.source as SocialSource} id={identity.id} />
            {props.children}
        </>
    );
}
