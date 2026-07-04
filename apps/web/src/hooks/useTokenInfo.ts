import type { GetTokenOptions } from '@dimensiondev/workers-token';
import { useQuery } from '@tanstack/react-query';
import { isEqual } from 'lodash-es';
import { useContext } from 'react';

import { TokenContext } from '@/components/Token/TokenContext.js';
import { searchToken } from '@/providers/firefly/worker/searchToken.js';

export function useTokenInfo(options: GetTokenOptions, enabled = true) {
    const { token: contextToken, tokenQueryOptions } = useContext(TokenContext);
    const initialData =
        contextToken && tokenQueryOptions && isEqual(tokenQueryOptions, options) ? contextToken : undefined;

    return useQuery({
        enabled,
        queryKey: ['token', options],
        queryFn: () => searchToken(options),
        initialData,
    });
}
