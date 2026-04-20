import { safeUnreachable } from '@dimensiondev/utils';
import { ensureHexPrefix } from '@dimensiondev/web3/utils';
import bs58 from 'bs58';
import { toBytes } from 'viem';

import { Protocol } from '@/constants/farcaster.js';

export function convertFarcasterAddressToBytes(address: string, protocol: Protocol): Uint8Array {
    try {
        switch (protocol) {
            case Protocol.ETHEREUM: {
                const hexWithPrefix = ensureHexPrefix(address);
                return toBytes(hexWithPrefix);
            }
            case Protocol.SOLANA: {
                return bs58.decode(address);
            }
            default:
                safeUnreachable(protocol);
                throw new Error(`Unsupported protocol: ${protocol}`);
        }
    } catch (error) {
        throw new Error(`Failed to convert address to bytes: ${error}`);
    }
}
