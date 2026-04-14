import { isValidAddress, isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3-utils';
import urlcat from 'urlcat';
import { mainnet } from 'viem/chains';

import { SolanaChainId } from '@/web3-shared/solana/types.js';

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
    const isAddress = isValidAddress(identity);
    if (isCoinId && !isAddress)
        return urlcat('/token/cex/:identity', {
            identity,
            chainId,
            address,
            trader,
            traderName: traderName || undefined,
        });

    const isEth = isValidAddressEthereum(identity) || isValidAddressEthereum(address);
    const isSol = isValidAddressSolana(identity) || isValidAddressSolana(address);
    const resolvedChainId = chainId || (isEth ? mainnet.id : isSol ? SolanaChainId.Mainnet : undefined);
    const resolveAddress = isAddress ? identity : address;
    if (resolvedChainId && resolveAddress) {
        return urlcat('/token/dex/:chainId/:address', {
            chainId: resolvedChainId,
            address: resolveAddress,
            trader,
            traderName: traderName || undefined,
        });
    }
    // Would resolve and redirect to new route at runtime
    return urlcat('/token/:identity', {
        identity,
        isCoinId: isCoinId ? 'true' : undefined,
        chainId: isCoinId ? undefined : resolvedChainId,
        address: resolveAddress,
        trader,
        traderName: traderName || undefined,
    });
}
