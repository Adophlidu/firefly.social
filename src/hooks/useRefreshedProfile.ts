import { useQuery } from '@tanstack/react-query';

import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useRefreshedProfile(profile: Profile, enabled = true) {
    const isLogin = useIsLogin(profile.source);
    return useQuery({
        enabled,
        staleTime: 0,
        queryKey: ['profile', profile.source, profile.profileId, isLogin],
        async queryFn() {
            try {
                const refreshed = await resolveSocialMediaProvider(profile.source).getProfileById(
                    profile.profileId,
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
