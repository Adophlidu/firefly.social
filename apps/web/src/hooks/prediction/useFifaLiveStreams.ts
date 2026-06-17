'use client';

import { useQuery } from '@tanstack/react-query';

import { getFifaLiveStreams } from '@/providers/firefly/prediction/getFifaLiveStreams.js';

/** Fetch the shared FIFA World Cup live stream sources. */
export function useFifaLiveStreams(enabled: boolean) {
    return useQuery({
        queryKey: ['prediction', 'fifa-live-streams'],
        queryFn: getFifaLiveStreams,
        enabled,
        staleTime: 60_000,
    });
}
