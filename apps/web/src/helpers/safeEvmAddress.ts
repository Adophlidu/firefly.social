import { InvalidAddressError } from '@dimensiondev/utils';
import { evmAddress } from '@lens-protocol/client';

export function safeEvmAddress(address: string) {
    try {
        return evmAddress(address);
    } catch (error) {
        throw new InvalidAddressError(address);
    }
}
