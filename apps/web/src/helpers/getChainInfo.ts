import { NetworkPluginID } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { type Runtime } from '@/providers/types/Trending.js';

interface Chain {
    name: string;
    runtime: Runtime;
    /** url of the icon*/
    icon: string;
}

const CHAINS: Chain[] = [
    {
        runtime: 'solana',
        name: 'Solana',
        icon: '/image/chains/solana.png',
    },
    {
        runtime: 'polkadot',
        name: 'Polkadot',
        icon: 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png',
    },
    {
        runtime: 'stellar',
        name: 'Stellar',
        icon: 'https://coin-images.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
    },
    {
        runtime: 'near-protocol',
        name: 'Near',
        icon: 'https://assets.coingecko.com/coins/images/10365/standard/near.jpg?1696510367',
    },
    {
        runtime: 'hedera-hashgraph',
        name: 'HashGraph',
        icon: 'https://coin-images.coingecko.com/coins/images/3688/large/hbar.png',
    },
    {
        runtime: 'zksync',
        name: 'ZKSync',
        icon: 'https://assets.coingecko.com/asset_platforms/images/121/small/zksync.jpeg?1706606814',
    },
    {
        runtime: 'tron',
        name: 'Tron',
        icon: 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png',
    },
    {
        runtime: 'arbitrum-one',
        name: 'Arbitrum-One',
        icon: '/image/chains/arbitrum.png',
    },
    {
        runtime: 'polygon-pos',
        name: 'Polygon-PoS',
        icon: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png',
    },
    {
        runtime: 'flow',
        name: 'Flow',
        icon: '/image/chains/flow.png',
    },
    {
        runtime: 'celo',
        name: 'Celo',
        icon: 'https://coin-images.coingecko.com/coins/images/11090/large/InjXBNx9_400x400.jpg',
    },
    {
        runtime: 'the-open-network',
        name: 'Ton',
        icon: '/image/chains/ton.png',
    },
    {
        runtime: 'algorand',
        name: 'Algorand',
        icon: 'https://assets.coingecko.com/asset_platforms/images/3/small/algorand_logo_mark_black.png?1706606710',
    },
    {
        runtime: 'optimistic-ethereum',
        name: 'Optimistic-Ethereum',
        icon: '/image/chains/optimism.png',
    },
    {
        runtime: 'avalanche',
        name: 'Avalanche',
        icon: '/image/chains/avalanche.png',
    },
    {
        runtime: 'base',
        name: 'Base',
        icon: '/image/chains/base.png',
    },
    {
        runtime: 'kava',
        name: 'Kava',
        icon: 'https://assets.coingecko.com/asset_platforms/images/2/small/kava.jpeg?1707096364',
    },
    {
        runtime: 'energi',
        name: 'Energi',
        icon: '/image/chains/energi.png',
    },
];

export function getChainInfo(runtime: Runtime | undefined, chainId: number | undefined) {
    // runtime is more accurate than chainId
    return CHAINS.find((x) => x.runtime === runtime) || getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, chainId);
}
