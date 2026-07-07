import { REQUIRE_LOGIN_FOLLOWING_CATEGORY } from '@dimensiondev/constants/computed';
import type { FollowCategory, SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren, Suspense } from 'react';

import { FollowPageLayout } from '@/app/[locale]/(normal)/profile/pages/FollowPageLayout.js';
import { ProfileRelationContextProvider } from '@/app/[locale]/(normal)/profile/pages/ProfileRelationContextProvider.js';
import { Loading } from '@/components/Loading.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { NoSSR } from '@/components/NoSSR.js';
import { Title } from '@/components/Profile/Title.js';
import { notFound } from '@/esm/navigation/server.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

interface Props extends LayoutProps<{ id: string; category: string; source: string; locale: string }> {}

export const revalidate = 300;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

export default async function Layout(props: Props) {
    const params = await props.params;
    setupLocaleFromParams(params.locale);
    if (!isFollowCategory(params.category)) notFound();
    const category = params.category as FollowCategory;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source) || source === Source.Twitter) notFound();

    // Stream a fallback while the profile loads instead of blocking this segment's render.
    return (
        <Suspense fallback={<Loading />}>
            <RelationLayoutChrome id={params.id} source={source} category={category}>
                {props.children}
            </RelationLayoutChrome>
        </Suspense>
    );
}

async function RelationLayoutChrome({
    id,
    source,
    category,
    children,
}: PropsWithChildren<{ id: string; source: SocialSource; category: FollowCategory }>) {
    const profile = await resolveSocialMediaProvider(source)
        .getProfileByHandle(id)
        .catch(() => null);
    if (!profile) notFound();

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
