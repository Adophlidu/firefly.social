import { safeUnreachable } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';
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
