import { SOL_ZERO_ADDRESS } from '@dimensiondev/web3/utils';

import { NetworkPluginID } from '@/constants/enum.js';
import type { ChainDescriptor, NetworkDescriptor } from '@/web3-shared/base/specs.js';
import { createFungibleToken } from '@/web3-shared/base/token.js';
import { SolanaChainId, SolanaNetworkType, SolanaSchemaType } from '@/web3-shared/solana/types.js';

const PLUGIN_ID = NetworkPluginID.PLUGIN_SOLANA;

export const CHAIN_DESCRIPTORS: ReadonlyArray<ChainDescriptor<SolanaChainId, SolanaSchemaType, SolanaNetworkType>> = [
    {
        ID: `${SolanaChainId.Mainnet}_Solana`,
        type: SolanaNetworkType.Solana,
        chainId: SolanaChainId.Mainnet,
        coinMarketCapChainId: '',
        coinGeckoChainId: '',
        coinGeckoPlatformId: '',
        name: 'Solana',
        color: '#17ac7c',
        fullName: 'Solana',
        shortName: 'Solana',
        network: 'mainnet',
        nativeCurrency: createFungibleToken(
            SolanaChainId.Mainnet,
            SolanaSchemaType.Fungible,
            SOL_ZERO_ADDRESS,
            'Solana',
            'SOL',
            9,
            'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        ),
        explorerUrl: {
            url: 'https://explorer.solana.com/',
        },
        rpcUrl: '',
        iconUrl: '/image/chains/solana.png',
        isCustomized: false,
    },
];

export const NETWORK_DESCRIPTORS: ReadonlyArray<NetworkDescriptor<SolanaChainId, SolanaNetworkType>> = [
    {
        ID: `${PLUGIN_ID}_solana`,
        networkSupporterPluginID: PLUGIN_ID,
        chainId: SolanaChainId.Mainnet,
        type: SolanaNetworkType.Solana,
        name: 'Solana',
        icon: '/image/chains/solana.png',
        iconColor: '#5d6fc0',
        averageBlockDelay: 15,
        isMainnet: true,
    },
];
