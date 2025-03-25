import { isNativeTokenAddress } from '@masknet/web3-shared-evm';

import { DEBANK_CHAIN_TO_CHAIN_ID_MAP } from '@/constants/chain.js';
import { isValidEthereumAddress } from '@/helpers/isValidEthereumAddress.js';
import type { Token } from '@/providers/types/Transfer.js';

export function isNativeToken(token: Token) {
    // It is a native token when token.id is not an address
    if (!isValidEthereumAddress(token.id)) {
        // according to https://docs.cloud.debank.com/en/readme/api-pro-reference/chain
        // id of native token is the same as chain id
        return DEBANK_CHAIN_TO_CHAIN_ID_MAP[token.id] === token.chainId;
    } else {
        return isNativeTokenAddress(token.id);
    }
}
