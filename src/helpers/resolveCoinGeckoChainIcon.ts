import { createLookupTableResolver } from '@dimensiondev/utils';

// https://docs.coingecko.com/reference/networks-list
export const resolveCoinGeckoChainIcon = createLookupTableResolver<string, string | undefined>(
    {
        'arbitrum-nova': '/image/chains/arbitrum.png',
        'binance-smart-chain': '/image/chains/binance.png',
        'polygon-pos': '/image/chains/polygon.png',
        avalanche: '/image/chains/avalanche.png',
        base: '/image/chains/base.png',
        ethereum: '/image/chains/ethereum.png',
        fantom: '/image/chains/fantom.png',
        fuse: '/image/chains/fuse.png',
        moonbeam: '/image/chains/moonbeam.png',
        scroll: '/image/chains/scroll.png',
        xdai: '/image/chains/xdai.png',
        zksync: '/image/chains/zksync.png',
        'the-open-network': '/image/chains/ton.png',
        sui: '/image/chains/sui.png',
    },
    undefined,
);
