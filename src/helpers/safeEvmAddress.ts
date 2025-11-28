import { evmAddress } from '@lens-protocol/client';

import { InvalidAddressError } from '@/constants/error.js';

export function safeEvmAddress(address: string) {
    try {
        return evmAddress(address);
    } catch (error) {
        throw new InvalidAddressError(address);
    }
}
