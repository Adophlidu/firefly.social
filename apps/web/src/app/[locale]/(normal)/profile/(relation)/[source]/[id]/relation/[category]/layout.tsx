import type { LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';

import { FollowPageLayout } from '@/app/[locale]/(normal)/profile/pages/FollowPageLayout.js';
import { ProfileRelationContextProvider } from '@/app/[locale]/(normal)/profile/pages/ProfileRelationContextProvider.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { NoSSR } from '@/components/NoSSR.js';
import { Title } from '@/components/Profile/Title.js';
import { REQUIRE_LOGIN_FOLLOWING_CATEGORY } from '@/constants/computed.js';
import { Locale } from '@/constants/enum.js';
import { type ProfileCategory, type ProfilePageSourceInURL, Source } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

interface Props extends LayoutProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export default async function Layout(props: Props) {
    setupLocaleFromParams(Locale.en);

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
            <Title title={displayName} className="border-line sticky top-0 border-b" />
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
