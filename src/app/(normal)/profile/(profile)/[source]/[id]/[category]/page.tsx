'use client';

import { useQuery } from '@tanstack/react-query';
import { Suspense, use, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { ProfilePageTimeline } from '@/components/Profile/ProfilePageTimeline.js';
import { type ProfileCategory, type ProfilePageSourceInURL, Source } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const source = resolveSourceFromUrlNoFallback(params.source);
    const { identity: cachedIdentity } = use(ProfileContext);
    if (!source || !isProfilePageSource(source)) notFound();

    // Lens used handle in profile page, while timeline can only be queried using profileId, it is necessary to convert handle to profileId.
    const { data: profile = null } = useQuery({
        queryKey: ['profile', source, params.id],
        queryFn: async () => {
            if (source === Source.Wallet || source === Source.WalletMix) return null;
            const provider = resolveSocialMediaProvider(source);
            return provider.getProfileByHandle(params.id, true);
        },
    });

    const identity = useMemo(
        () => resolveSpecialProfileIdentity({ id: profile?.profileId ?? cachedIdentity?.id ?? params.id, source }),
        [profile?.profileId, params.id, source, cachedIdentity?.id],
    );

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
