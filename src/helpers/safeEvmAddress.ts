import { evmAddress } from '@lens-protocol/client';

import { RecognizableError } from '@/constants/error.js';

export function safeEvmAddress(address: string) {
    try {
        return evmAddress(address);
    } catch (error) {
        throw new RecognizableError(`Invalid EVM address: ${address}`, true);
    }
}
