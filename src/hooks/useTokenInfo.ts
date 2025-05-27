import { useQuery } from '@tanstack/react-query';

import type { GetTokenOptions } from '@/providers/types/Firefly.js';
import { searchToken } from '@/services/searchToken.js';

export function useTokenInfo(options: GetTokenOptions, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['token', options],
        queryFn: () => searchToken(options),
    });
}
