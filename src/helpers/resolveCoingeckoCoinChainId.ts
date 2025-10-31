import { createLookupTableResolver } from '@firefly/utils';

/**
 * Get chain id of native coin on coingecko
 *
 * Note: this is different from `resolveCoinGeckoChainId`
 */
export const resolveCoinGeckoCoinChainId = createLookupTableResolver<string, number | undefined>(
    {
        ethereum: 1,
        binancecoin: 56,
        optimism: 10,
        'matic-network': 137,
    },
    undefined,
);
