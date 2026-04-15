import { isValidEnumValue } from '@dimensiondev/utils';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { ChainId } from '@/types/frame.js';

export function parseCAIP10(caip10: string) {
    if (!caip10.startsWith('eip155:')) throw new Error(`Invalid CAIP10 identifier: ${caip10}`);

    const fragments = caip10.split(':');
    const [chainId, address, ...parameters] = fragments.slice(1);

    const chainIdParsed = Number.parseInt(chainId, 10);
    if (isNaN(chainIdParsed) || chainIdParsed <= 0) throw new Error(`Invalid chain ID: ${chainId}`);
    if (!isValidEnumValue(chainIdParsed, ChainId)) throw new Error(`Unsupported chain ID: ${chainId}`);

    const addressParsed = isValidAddressEthereum(address) ? address : undefined;

    return {
        chainId: chainIdParsed,
        address: addressParsed,
        parameters,
    };
}
