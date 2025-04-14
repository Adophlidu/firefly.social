import { FollowPageLayout } from '@/app/(normal)/profile/pages/FollowPageLayout.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { Title } from '@/components/Profile/Title.js';
import { type ProfileCategory, Source, SourceInURL } from '@/constants/enum.js';
import { REQUIRE_LOGIN_FOLLOWING_CATEGORY } from '@/constants/index.js';
import { notFound } from '@/esm/navigation/server.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: SourceInURL }> {}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    if (!isFollowCategory(params.category)) notFound();

    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source) || source === Source.Twitter) notFound();

    const profile = await runInSafeAsync(() => resolveSocialMediaProvider(source).getProfileByIdOrHandle(id));
    if (!profile) notFound();

    const identity = resolveSpecialProfileIdentity({ source, id });

    return (
        <>
            <Title title={profile.displayName} className="sticky top-0 border-b border-line" />
            <FollowPageLayout profile={profile} identity={identity} category={params.category}>
                <LoginRequiredGuard
                    className="lg:!pt-0"
                    source={profile.source}
                    required={REQUIRE_LOGIN_FOLLOWING_CATEGORY.includes(params.category)}
                >
                    {props.children}
                </LoginRequiredGuard>
            </FollowPageLayout>
        </>
    );
}
