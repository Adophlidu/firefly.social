import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useRefreshedProfile<T extends Profile | null | undefined>(
    profile?: T,
    enabled = true,
): UseQueryResult<T> {
    const handleOrProfileId = resolveFireflyProfileId(profile ?? null);
    const isLogin = useIsLogin(profile?.source);
    return useQuery({
        enabled,
        queryKey: ['profile', profile?.source, handleOrProfileId, isLogin],
        async queryFn() {
            try {
                if (!profile || !handleOrProfileId) return null as T;
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
