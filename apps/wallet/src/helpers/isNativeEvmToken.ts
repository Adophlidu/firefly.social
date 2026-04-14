import { isValidAddressEthereum, isZeroAddressEthereum } from '@dimensiondev/web3-utils';

import { DEBANK_CHAIN_TO_CHAIN_ID_MAP } from '@/constants/debank.js';
import type { Token } from '@/providers/types/Transfer.js';

export function isNativeEvmToken(token: Pick<Token, 'id' | 'chainId'>) {
    // It is a native token when token.id is not an address
    if (!isValidAddressEthereum(token.id)) {
        // according to https://docs.cloud.debank.com/en/readme/api-pro-reference/chain
        // id of native token is the same as chain id
        return DEBANK_CHAIN_TO_CHAIN_ID_MAP[token.id] === token.chainId;
    } else {
        return isZeroAddressEthereum(token.id);
    }
}
