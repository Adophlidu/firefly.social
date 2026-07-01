import { useQuery } from '@tanstack/react-query';

import { BLOCKED_EVERYTHING, isGeoBlocked } from '@/constants/geoblock.js';
import { getGeoblock } from '@/providers/firefly/getGeoblock.js';

const STALE_TIME_DAY = 1000 * 60 * 60 * 24;

function getGeoblockQueryOptions() {
    return {
        queryKey: ['geoblock'],
        queryFn: getGeoblock,
        staleTime: STALE_TIME_DAY,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    } as const;
}

export function useIsBetsBlocked() {
    const { data, isLoading } = useQuery({
        ...getGeoblockQueryOptions(),
        select: (data) => isGeoBlocked(data ?? BLOCKED_EVERYTHING, 'bets'),
    });
    return { isBlocked: data ?? true, isLoading };
}

export function useIsSwapBlocked() {
    const { data, isLoading } = useQuery({
        ...getGeoblockQueryOptions(),
        select: (data) => isGeoBlocked(data ?? BLOCKED_EVERYTHING, 'swap'),
    });
    return { isBlocked: data ?? true, isLoading };
}

export function useIsPerpsBlocked() {
    const { data, isLoading } = useQuery({
        ...getGeoblockQueryOptions(),
        select: (data) => isGeoBlocked(data ?? BLOCKED_EVERYTHING, 'perps'),
    });
    return { isBlocked: data ?? true, isLoading };
}
