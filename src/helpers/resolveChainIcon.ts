import { createLookupTableResolver } from '@firefly/utils';

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
            'https://static.debank.com/image/chain/logo_url/op/0000000000000000000000000000000000000000.png',
        [EthereumChainId.Arbitrum]:
            'https://static.debank.com/image/chain/logo_url/arb/854f629937ce94bebeb2cd38fb336de7.png',
        [EthereumChainId.xDai]:
            'https://static.debank.com/image/chain/logo_url/xdai/43c1e09e93e68c9f0f3b132976394529.png',
        [EthereumChainId.Avalanche]:
            'https://static.debank.com/image/chain/logo_url/avax/4d1649e8a0c7dec9de3491b81807d402.png',
        [EthereumChainId.Aurora]:
            'https://static.debank.com/image/chain/logo_url/aurora/0000000000000000000000000000000000000000.png',
        [EthereumChainId.Conflux]:
            'https://static.debank.com/image/chain/logo_url/cfx/0000000000000000000000000000000000000000.png',
        [EthereumChainId.Fantom]:
            'https://static.debank.com/image/chain/logo_url/ftm/14133435f89637157a4405e954e1b1b2.png',
        [EthereumChainId.Scroll]:
            'https://static.debank.com/image/chain/logo_url/scrl/1fa5c7e0bfd353ed0a97c1476c9c42d2.png',
        [EthereumChainId.Metis]:
            'https://static.debank.com/image/chain/logo_url/metis/0000000000000000000000000000000000000000.png',
        [EthereumChainId.Mantle]:
            'https://static.debank.com/image/chain/logo_url/mantle/0000000000000000000000000000000000000000.png',
        [EthereumChainId.XLayer]:
            'https://static.debank.com/image/chain/logo_url/xlayer/0000000000000000000000000000000000000000.png',
        [EthereumChainId.Zora]:
            'https://static.debank.com/image/chain/logo_url/zora/0000000000000000000000000000000000000000.png',
        [SolanaChainId.Mainnet]:
            'https://static.debank.com/image/chain/logo_url/sol/0000000000000000000000000000000000000000.png',
    },
    undefined,
);
