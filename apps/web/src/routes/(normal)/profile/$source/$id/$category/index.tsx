import type { ProfileCategory, ProfilePageSourceInURL } from '@dimensiondev/enums';
import { SocialProfileCategory, Source, WalletProfileCategory } from '@dimensiondev/enums';
import { findChainData, type HeadContext, notFound, useParams, useSearch } from '@dimensiondev/ssr';
import { useQuery } from '@tanstack/react-query';
import { Suspense, use, useMemo } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Loading } from '@/components/Loading.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { ProfilePageTimeline } from '@/components/Profile/ProfilePageTimeline.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { createProfileMetadataFromProfile } from '@/providers/firefly/metadata/createProfileMetadataFromProfile.js';
import { createWalletProfileMetadataFromProfile } from '@/providers/firefly/metadata/createWalletProfileMetadataFromProfile.js';
import type { ProfilePageData } from '@/providers/firefly/metadata/getProfilePageData.js';

/** Shown in the page area while this route's data is in flight (layouts keep rendering). */
export const loadingComponent = () => (
    <div className="flex min-h-[50vh] items-center justify-center">
        <Loading minHeight={200} />
    </div>
);

// Mirrors the old layout's `revalidate = 300`: anonymous responses are
// CDN-cached; cookied requests bypass the CDN.
export const config = { cache: { sMaxAge: 300 }, navMode: 'client' } as const;

/**
 * Equivalent of the category layout's generateMetadata in the Next app
 * (src/app/[locale]/(normal)/profile/(profile)/[source]/[id]/[category]/layout.tsx).
 * Derived from the layout's loader data — no second profile fetch (the old
 * getProfilePageMetadata path re-fetched everything the layout already had).
 */
export function head({ params, allData }: HeadContext) {
    const { source, id, category } = params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source ?? '');
    const pathname =
        category === (isSocialSource(resolvedSource!) ? SocialProfileCategory.Feed : WalletProfileCategory.Transactions)
            ? `/profile/${source}/${id}`
            : `/profile/${source}/${id}/${category}`;

    const pageData = findChainData<ProfilePageData>(allData, 'profile/$source/$id/_layout.tsx');
    if (pageData?.socialProfile) {
        return fromNextMetadata(
            createProfileMetadataFromProfile(pageData.socialProfile, source as ProfilePageSourceInURL, pathname),
        );
    }
    if (pageData?.walletProfile) {
        return fromNextMetadata(createWalletProfileMetadataFromProfile(pageData.walletProfile, id ?? '', pathname));
    }
    return fromNextMetadata(createSiteMetadata(`/profile/${source}/${id}/${category}`));
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
    // Skip refetching when profileInitialData already matches — otherwise staleTime: 0 fires a duplicate request on mount.
    const { data: profile = null } = useQuery({
        queryKey: ['profile', source, idForQuery],
        queryFn: async () => {
            if (source === Source.Wallet || source === Source.WalletMix) return null;
            const provider = resolveSocialMediaProvider(source);
            return provider.getProfileByHandle(idForQuery, true);
        },
        initialData: profileInitialData,
        enabled: !profileInitialData,
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
