import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { resolveDebankChain } from '@/helpers/resolveDebankChain.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Token as DebankToken } from '@/providers/types/Debank.js';
import type { DebankTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

async function getAllTokenList(address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/misc/all_token_list', {
        address,
    });
    const result = await fireflySessionHolder.fetch<DebankTokensResponse>(url);
    return result.data?.list || [];
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
        staleTime: 1000 * 60 * 1,
    });

    return tokens.map((token) => {
        const chain = resolveDebankChain(token.chain);
        return {
            ...token,
            chainId: chain?.community_id,
            chainLogoUrl: chain?.logo_url,
        };
    });
}
