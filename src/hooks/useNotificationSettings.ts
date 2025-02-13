import { useQuery } from '@tanstack/react-query';

import { type SocialSource } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

export function useNotificationSettings(source: SocialSource) {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['notification-push-switch', source],
        staleTime: 1000 * 60 * 3, // 3 minutes
        async queryFn() {
            return resolveSocialMediaProvider(source).getNotificationSettings();
        },
    });

    return {
        enabled: data?.priority ?? false,
        isLoading,
        refetch,
    };
}
