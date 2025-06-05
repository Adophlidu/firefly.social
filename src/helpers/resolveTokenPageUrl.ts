import urlcat from 'urlcat';

import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';

interface Options {
    /** symbol, address, or coingecko coin id */
    identity: string;
    chainId?: string | number;
    /** if is coingecko coin id, which is more specific */
    isCoinId?: boolean;
    /** trader wallet address */
    trader?: string;
    /** to keep consistent with previous entry */
    traderName?: string;
    address?: string;
}

/**
 * A token can be uniquely identified by either:
 * - A CoinGecko ID (for tokens listed on CoinGecko)
 * - A combination of chain ID and contract address (for other tokens)
 *
 * Only symbol could be ambiguous
 */
export function resolveTokenPageUrl({ identity, chainId, address, isCoinId, trader, traderName }: Options) {
    return urlcat('/token/:identity', {
        identity,
        isCoinId: isCoinId ? 'true' : undefined,
        chainId,
        address: isValidAddressEthereum(identity) || isValidAddressSolana(identity) ? undefined : address,
        trader,
        traderName: traderName || undefined,
    });
}
