import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { isZeroAddressEthereum, isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { getTokenPrice } from '@/providers/coingecko/getTokenPrice.js';
import { getTokenPriceByAddress } from '@/providers/coingecko/getTokenPriceByAddress.js';
import { getCoinGeckoConstants } from '@/web3-shared/evm/constants.js';
import { getCoinGeckoConstants as getCoinGeckoConstantsSolana } from '@/web3-shared/solana/constants.js';

export function getFungibleTokenPrice(chainId: number, address: string) {
    const isSolana = isValidChainIdSolana(chainId);
    const { PLATFORM_ID = '', COIN_ID = '' } = isSolana
        ? getCoinGeckoConstantsSolana(chainId)
        : getCoinGeckoConstants(chainId);

    const isNative = isSolana
        ? isZeroAddressSolana(address)
        : isZeroAddressEthereum(address) || !isValidAddressEthereum(address);

    return isNative ? getTokenPrice(COIN_ID) : getTokenPriceByAddress(PLATFORM_ID, address);
}
