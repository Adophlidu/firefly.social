import { web3 } from '@coral-xyz/anchor';
import { type Address, isAddress } from 'viem';

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

/** sui token address is different from its wallet address */
export function isValidTokenAddressSui(address?: string): boolean {
    if (!address) return false;

    // <package_id>::<module_name>::<struct_name>
    const suiTokenPattern = /^0x[a-fA-F0-9]{64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;

    // format with leading zeros like coingecko returns
    const suiTokenPatternWithZeros = /^0x0*[a-fA-F0-9]{1,64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;

    return suiTokenPattern.test(address) || suiTokenPatternWithZeros.test(address);
}

export function isValidAddress(address?: string, strict = true) {
    return isValidAddressSolana(address, strict) || isValidAddressEthereum(address);
}
