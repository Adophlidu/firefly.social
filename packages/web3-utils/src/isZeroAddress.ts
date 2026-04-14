import { isSameEthereumAddress, isSameSolanaAddress } from '@/isSameAddress.js';

export const ETH_ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const SOL_ZERO_ADDRESS = 'So11111111111111111111111111111111111111112';
export const ETH_NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const SOL_NATIVE_TOKEN_ADDRESS = '11111111111111111111111111111111';

const NATIVE_TOKEN_ADDRESSES = new Set(
    [
        ETH_ZERO_ADDRESS, // zero address
        ETH_NATIVE_TOKEN_ADDRESS, // common representation
        SOL_ZERO_ADDRESS,
        SOL_NATIVE_TOKEN_ADDRESS,
        '0x0000000000000000000000000000000000001010', // Matic/Polygon native
        '0x000000000000000000000000000000000000800a', // Lens native
        '0xd29687c813d741e2f938f4ac377128810e217b1b', // Scroll native
    ].map((address) => address.toLowerCase()),
);

export function isZeroAddressEthereum(address?: string): address is typeof ETH_ZERO_ADDRESS {
    return isSameEthereumAddress(address, ETH_ZERO_ADDRESS);
}

export function isZeroAddressSolana(address?: string): address is typeof SOL_ZERO_ADDRESS {
    return isSameSolanaAddress(address, SOL_ZERO_ADDRESS);
}

export function isZeroAddress(address?: string): boolean {
    return isZeroAddressEthereum(address) || isZeroAddressSolana(address);
}

export function isNativeTokenAddress(address: string): boolean {
    if (!address) return true;
    return NATIVE_TOKEN_ADDRESSES.has(address.toLowerCase());
}

export function isNativeTokenOrSameAddress(address1: string, address2: string): boolean {
    if (isNativeTokenAddress(address1) && isNativeTokenAddress(address2)) return true;
    return address1.toLowerCase() === address2.toLowerCase();
}
