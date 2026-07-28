import { REQUIRE_LOGIN_FOLLOWING_CATEGORY } from '@dimensiondev/constants/computed';
import type { FollowCategory } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { NoSSR } from '@/components/NoSSR.js';
import { Title } from '@/components/Profile/Title.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { FollowPageLayout } from '@/legacy/[locale]/(normal)/profile/pages/FollowPageLayout.js';
import { ProfileRelationContextProvider } from '@/legacy/[locale]/(normal)/profile/pages/ProfileRelationContextProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface RelationLayoutData {
    profile: Profile;
    category: FollowCategory;
}

export async function loader({ params }: LoaderContext): Promise<RelationLayoutData> {
    if (!isFollowCategory(params.category!)) notFound();
    const category = params.category as FollowCategory;

    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!source || !isSocialSource(source) || source === Source.Twitter) notFound();

    // The loader blocks on the profile fetch; any failure renders the 404
    // page (matching the old Next layout).
    const profile = await resolveSocialMediaProvider(source)
        .getProfileByHandle(params.id!)
        .catch(() => null);
    if (!profile) notFound();

    return { profile, category };
}

/**
 * Port of the Next relation layout
 * (src/app/[locale]/(normal)/profile/(relation)/[source]/[id]/relation/[category]/layout.tsx):
 * title bar + follow tabs around the followers/following list pages.
 */
export default function ProfileRelationLayout({ children }: { children?: ReactNode }) {
    const { profile, category } = useLoaderData<RelationLayoutData>(
        'profile/$source/$id/relation/$category/_layout.tsx',
    );

    const displayName = profile.displayName ? (
        profile.displayName
    ) : profile.handle ? (
        `@${profile.handle}`
    ) : (
        <Trans>Unknown</Trans>
    );

    return (
        <>
            <Title title={displayName} className="sticky top-0 border-b border-line" />
            <FollowPageLayout profile={profile} category={category}>
                <LoginRequiredGuard
                    className="lg:!pt-0"
                    source={profile.source}
                    required={REQUIRE_LOGIN_FOLLOWING_CATEGORY.includes(category)}
                >
                    <NoSSR>
                        <ProfileRelationContextProvider profile={profile}>{children}</ProfileRelationContextProvider>
                    </NoSSR>
                </LoginRequiredGuard>
            </FollowPageLayout>
        </>
    );
}
