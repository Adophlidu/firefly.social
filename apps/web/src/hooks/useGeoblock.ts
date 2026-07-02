import { useQuery } from '@tanstack/react-query';

import { ALLOWED_EVERYTHING, isGeoBlocked } from '@/constants/geoblock.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getGeoblock } from '@/providers/firefly/endpoint/getGeoblock.js';

export function useGeoblock() {
    const { isLoading, data } = useQuery({
        queryKey: ['geoblock'],
        queryFn: getGeoblock,
        staleTime: STALE_TIMES.DAY_1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const result = data ?? ALLOWED_EVERYTHING;

    return {
        isBetsBlocked: isGeoBlocked(result, 'bets'),
        isSwapBlocked: isGeoBlocked(result, 'swap'),
        isPerpsBlocked: isGeoBlocked(result, 'perps'),
        isLoading,
    };
}
