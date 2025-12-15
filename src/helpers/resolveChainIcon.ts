import { createLookupTableResolver } from '@dimensiondev/utils';

import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const resolveChainIcon = createLookupTableResolver<number, string | undefined>(
    {
        [EthereumChainId.Mainnet]:
            'https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png',
        [EthereumChainId.Base]:
            'https://static.debank.com/image/chain/logo_url/base/ccc1513e4f390542c4fb2f4b88ce9579.png',
        [EthereumChainId.BSC]:
            'https://static.debank.com/image/chain/logo_url/bsc/bc73fa84b7fc5337905e527dadcbc854.png',
        [EthereumChainId.Polygon]:
            'https://static.debank.com/image/chain/logo_url/matic/52ca152c08831e4765506c9bd75767e8.png',
        [EthereumChainId.Optimism]:
            'https://static.debank.com/image/chain/logo_url/op/68bef0c9f75488f4e302805ef9c8fc84.png',
        [EthereumChainId.Arbitrum]:
            'https://static.debank.com/image/chain/logo_url/arb/854f629937ce94bebeb2cd38fb336de7.png',
        [EthereumChainId.xDai]:
            'https://static.debank.com/image/chain/logo_url/xdai/43c1e09e93e68c9f0f3b132976394529.png',
        [EthereumChainId.Avalanche]:
            'https://static.debank.com/image/chain/logo_url/avax/4d1649e8a0c7dec9de3491b81807d402.png',
        [EthereumChainId.Aurora]:
            'https://static.debank.com/image/chain/logo_url/aurora/c7590fd2defb8e7d7dc071166838c33a.png',
        [EthereumChainId.Conflux]:
            'https://static.debank.com/image/chain/logo_url/cfx/eab0c7304c6820b48b2a8d0930459b82.png',
        [EthereumChainId.Fantom]:
            'https://static.debank.com/image/chain/logo_url/ftm/14133435f89637157a4405e954e1b1b2.png',
        [EthereumChainId.Scroll]:
            'https://static.debank.com/image/chain/logo_url/scrl/1fa5c7e0bfd353ed0a97c1476c9c42d2.png',
        [EthereumChainId.Metis]:
            'https://static.debank.com/image/chain/logo_url/metis/7485c0a61c1e05fdf707113b6b6ac917.png',
        [EthereumChainId.Mantle]:
            'https://static.debank.com/image/chain/logo_url/mnt/0af11a52431d60ded59655c7ca7e1475.png',
        [EthereumChainId.XLayer]: 'https://icons-ckg.pages.dev/lz-scan/networks/xlayer.svg',
        [EthereumChainId.Zora]:
            'https://static.debank.com/image/chain/logo_url/zora/de39f62c4489a2359d5e1198a8e02ef1.png',
        [SolanaChainId.Mainnet]:
            'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    },
    undefined,
);
