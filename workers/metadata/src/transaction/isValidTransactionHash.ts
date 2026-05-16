import bs58 from 'bs58';
import { isHash } from 'viem';

function isValidSignature(signature: string) {
    try {
        const result = bs58.decode(signature);
        return result.length === 64;
    } catch {
        return false;
    }
}

export function isValidTransactionHash(hash: string): boolean {
    return isHash(hash) || isValidSignature(hash);
}
