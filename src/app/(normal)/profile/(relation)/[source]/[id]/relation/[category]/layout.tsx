import { Trans } from '@lingui/react/macro';

import { FollowPageLayout } from '@/app/(normal)/profile/pages/FollowPageLayout.js';
import { ProfileRelationContextProvider } from '@/app/(normal)/profile/pages/ProfileRelationContextProvider.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { NoSSR } from '@/components/NoSSR.js';
import { Title } from '@/components/Profile/Title.js';
import { type ProfileCategory, type ProfilePageSourceInURL, Source } from '@/constants/enum.js';
import { REQUIRE_LOGIN_FOLLOWING_CATEGORY } from '@/constants/index.js';
import { notFound } from '@/esm/navigation/server.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    if (!isFollowCategory(params.category)) notFound();

    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source) || source === Source.Twitter) notFound();

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
            <FollowPageLayout profile={profile} category={params.category}>
                <LoginRequiredGuard
                    className="lg:!pt-0"
                    source={profile.source}
                    required={REQUIRE_LOGIN_FOLLOWING_CATEGORY.includes(params.category)}
                >
                    <NoSSR>
                        <ProfileRelationContextProvider profile={profile}>
                            {props.children}
                        </ProfileRelationContextProvider>
                    </NoSSR>
                </LoginRequiredGuard>
            </FollowPageLayout>
        </>
    );
}
