import type { Metadata } from 'next';

import { ProfileCategoryTabs } from '@/app/(normal)/profile/pages/ProfileCategoryTabs.js';
import {
    type ProfileCategory,
    type ProfilePageSourceInURL,
    SocialProfileCategory,
    type SocialSource,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataProfileById } from '@/helpers/createMetadataProfileById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id, category } = await props.params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);

    if (resolvedSource && isProfilePageSource(resolvedSource)) {
        return createMetadataProfileById(`/profile/${source}/${id}/${category}`, source, id);
    }
    return createSiteMetadata(`/profile/${resolvedSource}/${id}/${category}`);
}

interface LayoutProps
    extends NextPageProps<{
        id: string;
        category: SocialProfileCategory | WalletProfileCategory;
        source: ProfilePageSourceInURL;
    }> {}

export default async function Layout(props: LayoutProps) {
    await setupLocaleForSSR();

    const { source, category, id } = await props.params;

    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || isFollowCategory(category)) notFound();

    const identity = resolveSpecialProfileIdentity({ source: resolvedSource, id });

    return (
        <>
            <ProfileCategoryTabs category={category} source={identity.source as SocialSource} id={identity.id} />
            {props.children}
        </>
    );
}
