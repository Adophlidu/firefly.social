import { createLookupTableResolver } from '@firefly/utils';

// https://docs.coingecko.com/reference/networks-list
export const resolveCoinGeckoChainIcon = createLookupTableResolver<string, string | undefined>(
    {
        'arbitrum-nova': 'https://static.debank.com/image/chain/logo_url/arb/854f629937ce94bebeb2cd38fb336de7.png',
        'binance-smart-chain':
            'https://static.debank.com/image/chain/logo_url/bsc/bc73fa84b7fc5337905e527dadcbc854.png',
        'polygon-pos': 'https://static.debank.com/image/chain/logo_url/matic/52ca152c08831e4765506c9bd75767e8.png',
        avalanche: 'https://static.debank.com/image/chain/logo_url/avax/4d1649e8a0c7dec9de3491b81807d402.png',
        base: 'https://static.debank.com/image/chain/logo_url/base/ccc1513e4f390542c4fb2f4b88ce9579.png',
        ethereum: 'https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png',
        fantom: 'https://static.debank.com/image/chain/logo_url/ftm/14133435f89637157a4405e954e1b1b2.png',
        fuse: 'https://static.debank.com/image/chain/logo_url/fuse/7a21b958761d52d04ff0ce829d1703f4.png',
        moonbeam: 'https://static.debank.com/image/chain/logo_url/mobm/fcfe3dee0e55171580545cf4d4940257.png',
        scroll: 'https://static.debank.com/image/chain/logo_url/scrl/1fa5c7e0bfd353ed0a97c1476c9c42d2.png',
        xdai: 'https://static.debank.com/image/chain/logo_url/xdai/43c1e09e93e68c9f0f3b132976394529.png',
        zksync: 'https://static.debank.com/image/chain/logo_url/era/2cfcd0c8436b05d811b03935f6c1d7da.png',
        'the-open-network': 'https://s2.coinmarketcap.com/static/img/coins/128x128/11419.png',
        sui: 'https://assets.coingecko.com/asset_platforms/images/126/small/sui-ocean-square.png',
    },
    undefined,
);
