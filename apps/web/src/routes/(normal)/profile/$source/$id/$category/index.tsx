import type { ProfileCategory } from '@dimensiondev/enums';
import { SocialProfileCategory, Source, WalletProfileCategory } from '@dimensiondev/enums';
import { type HeadContext, notFound, useParams, useSearch } from '@dimensiondev/ssr';
import { useQuery } from '@tanstack/react-query';
import { Suspense, use, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { ProfilePageTimeline } from '@/components/Profile/ProfilePageTimeline.js';
import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { getProfilePageMetadata } from '@/providers/firefly/metadata/getProfilePageMetadata.js';

// Mirrors the old layout's `revalidate = 300`: anonymous responses are
// CDN-cached; cookied requests bypass the CDN.
export const config = { cache: { sMaxAge: 300 } };

/**
 * Equivalent of the category layout's generateMetadata in the Next app
 * (src/app/[locale]/(normal)/profile/(profile)/[source]/[id]/[category]/layout.tsx).
 */
export async function head({ params }: HeadContext) {
    const { source, id, category } = params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source ?? '');

    if (resolvedSource && isProfilePageSource(resolvedSource)) {
        // the public URL of the default category is the bare profile URL
        const defaultCategory = isSocialSource(resolvedSource)
            ? SocialProfileCategory.Feed
            : WalletProfileCategory.Transactions;
        const pathname =
            category === defaultCategory ? `/profile/${source}/${id}` : `/profile/${source}/${id}/${category}`;
        return fromNextMetadata(await getProfilePageMetadata(source ?? '', id ?? '', pathname));
    }
    return fromNextMetadata(createSiteMetadata(`/profile/${resolvedSource}/${id}/${category}`));
}

export default function ProfileCategoryPage() {
    const params = useParams();
    const { identity: cachedIdentity, refreshedSocialProfile: cachedSocialProfile } = use(ProfileContext);
    const searchParams = useSearch();

    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!source || !isProfilePageSource(source)) notFound();

    const idForQuery =
        source === Source.Farcaster && searchParams.get('fid') ? `!${searchParams.get('fid')}` : params.id!;

    const profileInitialData = useMemo(() => {
        if (!cachedSocialProfile) return undefined;
        if (
            cachedSocialProfile.handle === idForQuery ||
            cachedSocialProfile.profileId === idForQuery ||
            cachedSocialProfile.handle === params.id ||
            cachedSocialProfile.profileId === params.id
        ) {
            return cachedSocialProfile;
        }
        return undefined;
    }, [cachedSocialProfile, idForQuery, params.id]);

    // Lens used handle in profile page, while timeline can only be queried using profileId, it is necessary to convert handle to profileId.
    const { data: profile = null } = useQuery({
        queryKey: ['profile', source, idForQuery],
        queryFn: async () => {
            if (source === Source.Wallet || source === Source.WalletMix) return null;
            const provider = resolveSocialMediaProvider(source);
            return provider.getProfileByHandle(idForQuery, true);
        },
        initialData: profileInitialData,
    });

    const profileId = profile?.profileId || cachedIdentity?.id || idForQuery || params.id;
    const identity = useMemo(() => resolveSpecialProfileIdentity({ id: profileId, source }), [profileId, source]);

    const content = (
        <Suspense fallback={<Loading className="!min-h-[unset] flex-1 py-2" />}>
            <ProfilePageTimeline category={params.category as ProfileCategory} identity={identity} />
        </Suspense>
    );

    if (isRequestedLoginSource(source)) {
        return (
            <LoginRequiredGuard source={source} className="md:!pt-0">
                {content}
            </LoginRequiredGuard>
        );
    }

    return content;
}
