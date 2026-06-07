import type { GetTokenOptions } from '@dimensiondev/workers-token';
import { useQuery } from '@tanstack/react-query';

import { searchToken } from '@/providers/firefly/worker/searchToken.js';

export function useTokenInfo(options: GetTokenOptions, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['token', options],
        queryFn: () => searchToken(options),
    });
}
