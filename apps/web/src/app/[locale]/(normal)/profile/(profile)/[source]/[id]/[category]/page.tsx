'use client';

import type { ProfileCategory, ProfilePageSourceInURL } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { useQuery } from '@tanstack/react-query';
import { Suspense, use, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { ProfilePageTimeline } from '@/components/Profile/ProfilePageTimeline.js';
import { notFound, useSearchParams } from '@/esm/navigation.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';

interface Props extends LayoutProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const { identity: cachedIdentity, refreshedSocialProfile: cachedSocialProfile } = use(ProfileContext);
    const searchParams = useSearchParams();

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();

    const idForQuery =
        source === Source.Farcaster && searchParams.get('fid') ? `!${searchParams.get('fid')}` : params.id;

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
            <ProfilePageTimeline category={params.category} identity={identity} />
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
