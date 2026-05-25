import { EMPTY_LIST } from '@dimensiondev/constants';
import { resolveDebankChain } from '@dimensiondev/web3/chains';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { STALE_TIMES } from '@/constants/query.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Token as DebankToken } from '@/providers/types/Debank.js';
import type { DebankTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

async function getAllTokenList(address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/misc/all_token_list', {
        address,
    });
    const result = await fireflySessionHolder.fetch<DebankTokensResponse>(url);
    return result.data?.list || EMPTY_LIST;
}

export async function getTokensByAddress(address: string): Promise<
    Array<
        DebankToken & {
            chainId?: number;
            chainLogoUrl?: string;
        }
    >
> {
    const tokens = await queryClient.fetchQuery({
        queryKey: ['debank', 'tokens', address.toLowerCase()],
        queryFn: () => getAllTokenList(address),
        staleTime: STALE_TIMES.MINUTE_1,
    });

    return tokens.map((token) => {
        const chain = resolveDebankChain(token.chain);
        const chainId = chain?.community_id;
        return {
            ...token,
            chainId,
            chainLogoUrl: chain?.logo_url,
        };
    });
}
