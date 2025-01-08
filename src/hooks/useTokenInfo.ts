import { useQuery } from '@tanstack/react-query';

import { formatMarketToken } from '@/helpers/formatMarketToken.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokens } from '@/services/searchTokens.js';

export function useTokenInfo(symbolOrId: string) {
    return useQuery({
        queryKey: ['token', symbolOrId],
        queryFn: async () => {
            const tokens = await searchTokens(symbolOrId);
            if (tokens.data[0]) return formatMarketToken(tokens.data[0]);
            return getTokenFromCoinGecko(symbolOrId);
        },
    });
}
