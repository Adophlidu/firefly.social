import { isSameEthereumAddress, isSameSolanaAddress } from '@/helpers/isSameAddress.js';

export const ETH_ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const SOL_ZERO_ADDRESS = 'So11111111111111111111111111111111111111112';

export function isZeroAddressEthereum(address?: string): address is typeof ETH_ZERO_ADDRESS {
    return isSameEthereumAddress(address, ETH_ZERO_ADDRESS);
}

export function isZeroAddressSolana(address?: string): address is typeof SOL_ZERO_ADDRESS {
    return isSameSolanaAddress(address, SOL_ZERO_ADDRESS);
}

export function isZeroAddress(address?: string): boolean {
    return isZeroAddressEthereum(address) || isZeroAddressSolana(address);
}
