import { chains } from '@dimensiondev/web3/chains';
import { isEqual } from 'lodash-es';

export function resolveWagmiChain(chainId: number) {
    return chains.find((chain) => isEqual(chain.id, chainId));
}
