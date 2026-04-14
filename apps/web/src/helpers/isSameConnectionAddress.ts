import { safeUnreachable } from '@dimensiondev/utils';
import { isSameEthereumAddress, isSameSolanaAddress } from '@dimensiondev/web3-utils';

export function isSameConnectionAddress(platform: 'eth' | 'solana', address: string, otherAddress: string) {
    switch (platform) {
        case 'eth':
            return isSameEthereumAddress(address, otherAddress);
        case 'solana':
            return isSameSolanaAddress(address, otherAddress);
        default:
            safeUnreachable(platform);
            return false;
    }
}
