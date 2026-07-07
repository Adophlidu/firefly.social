import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import type { CoinGeckoToken } from '@dimensiondev/workers-token';

import { searchToken } from '@/providers/firefly/worker/searchToken.js';

export async function searchTokenByKeyword(
    keyword: string,
    options?: {
        chainId?: number;
        address?: string;
        isCoinId?: boolean;
    },
): Promise<CoinGeckoToken | null> {
    const isAddress = isValidAddressEthereum(keyword) || isValidAddressSolana(keyword);

    return searchToken({
        token_symbol: isAddress || options?.isCoinId ? undefined : keyword,
        coingecko_id: options?.isCoinId ? keyword : undefined,
        address: isAddress ? keyword : options?.address,
        chain_id: options?.chainId,
    });
}
