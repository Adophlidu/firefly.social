import { isEqual } from 'lodash-es';

import { chains } from '@/configs/chains.js';

export function resolveWagmiChain(chainId: number) {
    return chains.find((chain) => isEqual(chain.id, chainId));
}
