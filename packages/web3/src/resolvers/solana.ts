import { solana, solanaChains, solanaDevnet, solanaTestnet } from '@/chains/sol.js';
import { SOL_ZERO_ADDRESS } from '@/constants.js';
import type { ChainDescriptor } from '@/resolvers/base.js';
import { ChainResolver, ExplorerResolver } from '@/resolvers/base.js';

type SolanaSupportedChain = (typeof solanaChains)[number];

const metadata = {
    [solana.id]: { name: 'Solana', shortName: 'Solana', explorerUrl: 'https://explorer.solana.com/' },
    [solanaTestnet.id]: {
        name: 'Solana Testnet',
        shortName: 'Solana',
        explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
    },
    [solanaDevnet.id]: {
        name: 'Solana Devnet',
        shortName: 'Solana',
        explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    },
} as const;

const descriptors: readonly ChainDescriptor[] = solanaChains.map((chain: SolanaSupportedChain) => {
    const meta = metadata[chain.id];
    return {
        chainId: chain.id,
        name: meta.name,
        fullName: meta.name,
        shortName: meta.shortName,
        nativeCurrency: {
            id: SOL_ZERO_ADDRESS,
            chainId: chain.id,
            type: 'Fungible',
            schema: 'Fungible',
            address: SOL_ZERO_ADDRESS,
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9,
            logoURL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        },
        explorerUrl: {
            url: meta.explorerUrl,
        },
    };
});

export const SolanaChainResolver = new ChainResolver(() => descriptors);
export const SolanaExplorerResolver = new ExplorerResolver(() => descriptors);
