import { skipToken, useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/enum';
import { infoClient } from '@/providers/client';
import type { CommonQueryOptions } from '@/types/ui';

export function useUserLegalCheck(address?: string, options?: CommonQueryOptions) {
    return useQuery({
        queryKey: ['wallet', 'legalCheck', address?.toLowerCase()],
        staleTime: STALE_TIMES.MINUTE_2,
        queryFn: !address ? skipToken : () => infoClient.legalCheck({ user: address }),
        ...options,
        enabled: !!address && options?.enabled,
    });
}
