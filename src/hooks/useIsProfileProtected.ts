import { useSuspenseQuery } from '@tanstack/react-query';

import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';

export function useIsProfileProtected(source: SocialSource, profileId: string) {
    const isLogin = useIsLogin(source);
    const { data: isProtected } = useSuspenseQuery({
        queryKey: ['profile-protected', source, profileId, isLogin],
        queryFn: async () => {
            // Querying protected flag for Twitter
            if (source !== Source.Twitter) return false;

            const provider = resolveSocialMediaProvider(source);
            const profile = await provider.getProfileById(profileId);
            const profileWithProtected = await provider.getProfileByHandle(profile.handle);
            return profileWithProtected?.protected;
        },
    });
    return isProtected;
}
