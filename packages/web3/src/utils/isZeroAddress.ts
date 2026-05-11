import {
    ETH_NATIVE_TOKEN_ADDRESS,
    ETH_ZERO_ADDRESS,
    LENS_NATIVE_TOKEN_ADDRESS,
    POL_NATIVE_TOKEN_ADDRESS,
    SCROLL_NATIVE_TOKEN_ADDRESS,
    SOL_NATIVE_TOKEN_ADDRESS,
    SOL_ZERO_ADDRESS,
} from '@/constants.js';
import { isSameEthereumAddress, isSameSolanaAddress } from '@/utils/isSameAddress.js';

const NATIVE_TOKEN_ADDRESSES = new Set(
    [
        ETH_ZERO_ADDRESS, // zero address
        ETH_NATIVE_TOKEN_ADDRESS, // common representation
        SOL_ZERO_ADDRESS,
        SOL_NATIVE_TOKEN_ADDRESS,
        POL_NATIVE_TOKEN_ADDRESS, // Matic/Polygon native
        LENS_NATIVE_TOKEN_ADDRESS, // Lens native
        SCROLL_NATIVE_TOKEN_ADDRESS, // Scroll native
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

export function isNativeTokenAddress(address: string | undefined): boolean {
    if (!address) return true;
    return NATIVE_TOKEN_ADDRESSES.has(address.toLowerCase());
}

export function isNativeTokenOrSameAddress(address1: string, address2: string): boolean {
    if (isNativeTokenAddress(address1) && isNativeTokenAddress(address2)) return true;
    return address1.toLowerCase() === address2.toLowerCase();
}
