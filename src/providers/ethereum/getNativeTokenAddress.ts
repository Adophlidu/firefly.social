import { zeroAddress } from 'viem';

import { EVM_NATIVE_TOKEN_ADDRESS_MAP } from '@/constants/token.js';

export function getEvmNativeTokenAddress(chainId: number) {
    return EVM_NATIVE_TOKEN_ADDRESS_MAP[chainId] || zeroAddress;
}
