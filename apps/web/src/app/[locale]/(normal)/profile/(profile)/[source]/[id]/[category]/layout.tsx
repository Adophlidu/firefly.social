import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { ProfileCategoryTabs } from '@/app/[locale]/(normal)/profile/pages/ProfileCategoryTabs.js';
import type {
    ProfileCategory,
    ProfilePageSourceInURL,
    SocialProfileCategory,
    SocialSource,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataProfileById } from '@/helpers/createMetadataProfileById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';

interface Props extends LayoutProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id, category } = await props.params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);

    if (resolvedSource && isProfilePageSource(resolvedSource)) {
        return createMetadataProfileById(source, id, `/profile/${source}/${id}/${category}`);
    }
    return createSiteMetadata(`/profile/${resolvedSource}/${id}/${category}`);
}

interface ProfileLayoutProps
    extends LayoutProps<{
        id: string;
        category: SocialProfileCategory | WalletProfileCategory;
        source: ProfilePageSourceInURL;
    }> {}

export default async function Layout(props: ProfileLayoutProps) {
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
