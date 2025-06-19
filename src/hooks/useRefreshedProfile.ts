import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useRefreshedProfile<T extends Profile>(profile: T, enabled = true): UseQueryResult<T> {
    const handleOrProfileId = resolveFireflyProfileId(profile ?? null);
    const myProfile = useCurrentProfile(profile.source);
    return useQuery({
        enabled,
        queryKey: ['profile', profile?.source, handleOrProfileId, myProfile?.profileId],
        async queryFn() {
            try {
                if (!profile || !handleOrProfileId) return null;
                const refreshed = await resolveSocialMediaProvider(profile.source).getProfileByIdOrHandle(
                    handleOrProfileId,
                    true,
                );
                return refreshed ?? profile;
            } catch {
                return profile;
            }
        },
        initialData: profile,
    });
}
