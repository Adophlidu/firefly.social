import { isEqual } from 'lodash-es';

import { chains } from '@/configs/wagmiClient.js';

export function resolveWagmiChain(chainId: number) {
    return chains.find((chain) => isEqual(chain.id, chainId));
}
