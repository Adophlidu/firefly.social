import { useQuery } from '@tanstack/react-query';

import { Source } from '@/constants/enum.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export function useBskyPreferences(enabled = false) {
    const currentProfile = useCurrentProfile(Source.Bsky);

    return useQuery({
        enabled,
        queryKey: ['preferences', Source.Bsky, currentProfile?.profileId],
        queryFn: () => {
            return bskySessionHolder.agent.getPreferences();
        },
    });
}
