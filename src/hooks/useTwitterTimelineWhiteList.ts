import { useQuery } from '@tanstack/react-query';

import { getTwitterTimelineWhitelist } from '@/providers/twitter/getTwitterTimelineWhitelist.js';

export function useTwitterTimelineWhitelist() {
    return useQuery({
        queryKey: ['twitter-timeline-white-list'],
        queryFn: getTwitterTimelineWhitelist,
        retry: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
