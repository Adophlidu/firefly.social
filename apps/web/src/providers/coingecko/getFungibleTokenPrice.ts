import { isValidChainIdSolana } from '@dimensiondev/web3/chains';
import { isValidAddressEthereum, isZeroAddressEthereum, isZeroAddressSolana } from '@dimensiondev/web3/utils';

import { getCoinGeckoConstants } from '@/providers/coingecko/getCoinGeckoConstants.js';
import { getTokenPrice } from '@/providers/coingecko/getTokenPrice.js';
import { getTokenPriceByAddress } from '@/providers/coingecko/getTokenPriceByAddress.js';

export function getFungibleTokenPrice(chainId: number, address: string) {
    const isSolana = isValidChainIdSolana(chainId);
    const { PLATFORM_ID = '', COIN_ID = '' } = isSolana
        ? { PLATFORM_ID: 'solana', COIN_ID: 'solana' }
        : getCoinGeckoConstants(chainId);

    const isNative = isSolana
        ? isZeroAddressSolana(address)
        : isZeroAddressEthereum(address) || !isValidAddressEthereum(address);

    return isNative ? getTokenPrice(COIN_ID) : getTokenPriceByAddress(PLATFORM_ID, address);
}
