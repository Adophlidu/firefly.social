import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useSuspenseQuery } from '@tanstack/react-query';

import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';

export function useIsProfileProtected(source: SocialSource, profileId: string) {
    const isLogin = useIsLogin(source);
    const { data: isProtected } = useSuspenseQuery({
        // Only Twitter's protected flag depends on the viewer's session; for every other
        // source the result is a constant `false`. Keep `isLogin` out of the key for those
        // so the server (isLogin=false) and client (isLogin=true) read the same cache entry —
        // otherwise an SSR-rendered timeline suspends on hydration for logged-in users.
        queryKey: ['profile-protected', source, profileId, source === Source.Twitter ? isLogin : false],
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
