import { web3 } from '@coral-xyz/anchor';
import { type Address, isAddress } from 'viem';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';

export function isValidAddressSolana(address?: string, strict = true) {
    const length = address?.length;
    if (!length || length < 32 || length > 44) return false;
    try {
        new web3.PublicKey(address);
        return true;
    } catch {
        // For broken solana address, such as all lowercase
        return strict ? false : /^[1-9a-zA-Z]+$/.test(address);
    }
}

export function isValidAddressEthereum(address: string | undefined): address is Address {
    const address_ = address?.toLowerCase();
    if (!address_) return false;
    if (!address_.startsWith('0x') && !address_.startsWith('0X')) return false;
    return isAddress(address_ as Address);
}

export function isValidAddress(address?: string, strict = true) {
    return isValidAddressSolana(address, strict) || isValidAddressEthereum(address);
}

export function isZeroAddress(address?: string): boolean {
    return isSameAddress(address, ETH_ZERO_ADDRESS) || isSameAddress(address, SOL_ZERO_ADDRESS);
}
