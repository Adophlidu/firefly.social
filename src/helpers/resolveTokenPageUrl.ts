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

export function resolveTokenPageUrl({ identity, chainId, address, isCoinId, trader, traderName }: Options) {
    return urlcat('/token/:identity', {
        identity,
        chainId,
        isCoinId: isCoinId ? 'true' : undefined,
        trader,
        traderName: traderName || undefined,
        address: isValidAddressEthereum(identity) || isValidAddressSolana(identity) ? undefined : address,
    });
}
