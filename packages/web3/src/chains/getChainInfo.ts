import { getChainIcon } from '@/chains/getChainIcon.js';
import { getChainName } from '@/chains/getChainName.js';
import { parseEthereumChainId } from '@/chains/parseEthereumChainId.js';
import { parseSolanaChainId } from '@/chains/parseSolanaChainId.js';

export interface ChainInfo {
    name: string;
    icon: string;
}

const RUNTIME_TO_CHAIN_ID: Readonly<Record<string, number>> = {
    ethereum: 1,
    'binance-smart-chain': 56,
    'polygon-pos': 137,
    'arbitrum-one': 42161,
    'optimistic-ethereum': 10,
    avalanche: 43114,
    base: 8453,
    celo: 42220,
    zksync: 324,
    solana: 101,
};

const RUNTIME_FALLBACK_INFO: Readonly<Record<string, ChainInfo>> = {
    polkadot: {
        name: 'Polkadot',
        icon: 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png',
    },
    stellar: {
        name: 'Stellar',
        icon: 'https://coin-images.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
    },
    'near-protocol': {
        name: 'Near',
        icon: 'https://assets.coingecko.com/coins/images/10365/standard/near.jpg?1696510367',
    },
    'hedera-hashgraph': {
        name: 'HashGraph',
        icon: 'https://coin-images.coingecko.com/coins/images/3688/large/hbar.png',
    },
    tron: {
        name: 'Tron',
        icon: 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png',
    },
    flow: {
        name: 'Flow',
        icon: '/image/chains/flow.png',
    },
    'the-open-network': {
        name: 'Ton',
        icon: '/image/chains/ton.png',
    },
    algorand: {
        name: 'Algorand',
        icon: 'https://assets.coingecko.com/asset_platforms/images/3/small/algorand_logo_mark_black.png?1706606710',
    },
    kava: {
        name: 'Kava',
        icon: 'https://assets.coingecko.com/asset_platforms/images/2/small/kava.jpeg?1707096364',
    },
    energi: {
        name: 'Energi',
        icon: '/image/chains/energi.png',
    },
};

export function getChainInfo(runtime: string | undefined, chainId: number | undefined) {
    const normalizedChainId =
        parseEthereumChainId(chainId) ?? parseSolanaChainId(chainId) ?? (runtime ? RUNTIME_TO_CHAIN_ID[runtime] : null);

    if (typeof normalizedChainId === 'number') {
        const icon = getChainIcon(normalizedChainId);
        const name = getChainName(normalizedChainId, false) || (runtime ? RUNTIME_FALLBACK_INFO[runtime]?.name : null);
        if (icon && name) return { name, icon };
        if (icon) return { name: `Chain ${normalizedChainId}`, icon };
    }

    if (runtime) {
        const fallback = RUNTIME_FALLBACK_INFO[runtime];
        if (fallback) return fallback;
    }

    const icon = getChainIcon(chainId);
    if (!icon || !chainId) return undefined;
    return {
        name: `Chain ${chainId}`,
        icon,
    };
}
