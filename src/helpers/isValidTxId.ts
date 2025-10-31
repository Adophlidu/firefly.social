import { safeUnreachable } from '@firefly/utils';
import bs58 from 'bs58';
import { isHash } from 'viem';

import { NetworkType } from '@/constants/enum.js';

function isValidSignature(signature: string) {
    try {
        const result = bs58.decode(signature);
        return result.length === 64;
    } catch {
        return false;
    }
}

/**
 * Hash for evm; Signature for solana
 * ! only check format, not verify the tx
 */
export function isValidTxId(txId: string, networkType?: NetworkType) {
    if (!networkType) return isHash(txId) || isValidSignature(txId);

    switch (networkType) {
        case NetworkType.Ethereum:
            return isHash(txId);
        case NetworkType.Solana:
            return isValidSignature(txId);
        default:
            safeUnreachable(networkType);
            return false;
    }
}
