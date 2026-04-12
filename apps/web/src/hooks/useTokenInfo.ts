import { useQuery } from '@tanstack/react-query';

import { searchToken } from '@/providers/firefly/worker/searchToken.js';
import type { GetTokenOptions } from '@/providers/types/Firefly.js';

export function useTokenInfo(options: GetTokenOptions, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['token', options],
        queryFn: () => searchToken(options),
    });
}
