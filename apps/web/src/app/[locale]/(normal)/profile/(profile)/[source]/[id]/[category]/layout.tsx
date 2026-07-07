import { SocialProfileCategory, type SocialSource, WalletProfileCategory } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { ProfileCategoryTabs } from '@/app/[locale]/(normal)/profile/pages/ProfileCategoryTabs.js';
import { notFound } from '@/esm/navigation/server.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { resolveProfilePageMetadata } from '@/providers/firefly/metadata/resolveProfilePageMetadata.js';

interface Props extends LayoutProps<{ id: string; category: string; source: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id, category } = await props.params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source);

    if (resolvedSource && isProfilePageSource(resolvedSource)) {
        // the public URL of the default category is the bare profile URL (see proxy/handlers/profileRoutes.ts)
        const defaultCategory = isSocialSource(resolvedSource)
            ? SocialProfileCategory.Feed
            : WalletProfileCategory.Transactions;
        const pathname =
            category === defaultCategory ? `/profile/${source}/${id}` : `/profile/${source}/${id}/${category}`;
        return resolveProfilePageMetadata(source, id, pathname);
    }
    return createSiteMetadata(`/profile/${resolvedSource}/${id}/${category}`);
}

interface ProfileLayoutProps extends LayoutProps<{
    id: string;
    category: string;
    source: string;
}> {}

export default async function Layout(props: ProfileLayoutProps) {
    const { source, id } = await props.params;
    const category = (await props.params).category as SocialProfileCategory | WalletProfileCategory;

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
