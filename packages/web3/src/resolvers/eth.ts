import { chains } from '@/chains/eth.js';
import { ETH_NATIVE_TOKEN_ADDRESS } from '@/constants.js';
import type { ChainDescriptor } from '@/resolvers/base.js';
import { ChainResolver, ExplorerResolver } from '@/resolvers/base.js';

type SupportedChain = (typeof chains)[number];

const descriptors: readonly ChainDescriptor[] = chains.map((chain: SupportedChain) => ({
    chainId: chain.id,
    name: chain.name,
    fullName: chain.name,
    nativeCurrency: {
        id: ETH_NATIVE_TOKEN_ADDRESS,
        chainId: chain.id,
        type: 'Fungible',
        schema: 'Native',
        address: ETH_NATIVE_TOKEN_ADDRESS,
        name: chain.nativeCurrency.name,
        symbol: chain.nativeCurrency.symbol,
        decimals: chain.nativeCurrency.decimals,
    },
    explorerUrl: {
        url: chain.blockExplorers?.default?.url ?? '',
    },
}));

export const EthChainResolver = new ChainResolver(() => descriptors);
export const EthExplorerResolver = new ExplorerResolver(() => descriptors);
