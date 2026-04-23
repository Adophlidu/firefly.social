import { resolveDebankChainId } from '@/chains/resolveDebankChainId.js';
import { isValidAddressEthereum } from '@/utils/isValidAddress.js';
import { isZeroAddressEthereum } from '@/utils/isZeroAddress.js';

/** Minimal token shape used by Debank-style native token checks. */
export interface NativeTokenDebankLike {
    id: string;
    chainId: number;
}

export function isNativeTokenDebank(token: NativeTokenDebankLike) {
    // It is a native token when token.id is not an address
    if (!isValidAddressEthereum(token.id)) {
        // according to https://docs.cloud.debank.com/en/readme/api-pro-reference/chain
        // id of native token is the same as chain id
        return resolveDebankChainId(token.id) === token.chainId;
    } else {
        return isZeroAddressEthereum(token.id);
    }
}
