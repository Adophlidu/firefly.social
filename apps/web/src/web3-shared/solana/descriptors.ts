import { solana } from '@dimensiondev/web3/chains';
import { SOL_ZERO_ADDRESS } from '@dimensiondev/web3/constants';

import { NetworkPluginID } from '@/constants/enum.js';
import type { ChainDescriptor, NetworkDescriptor } from '@/web3-shared/base/specs.js';
import { createFungibleToken } from '@/web3-shared/base/token.js';
import { SolanaSchemaType } from '@/web3-shared/solana/types.js';

const PLUGIN_ID = NetworkPluginID.PLUGIN_SOLANA;

export const CHAIN_DESCRIPTORS: ReadonlyArray<ChainDescriptor<number, SolanaSchemaType>> = [
    {
        ID: `${solana.id}_Solana`,
        chainId: solana.id,
        coinMarketCapChainId: '',
        coinGeckoChainId: '',
        coinGeckoPlatformId: '',
        name: 'Solana',
        color: '#17ac7c',
        fullName: 'Solana',
        shortName: 'Solana',
        network: 'mainnet',
        nativeCurrency: createFungibleToken(
            solana.id,
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

export const NETWORK_DESCRIPTORS: ReadonlyArray<NetworkDescriptor<number>> = [
    {
        ID: `${PLUGIN_ID}_solana`,
        networkSupporterPluginID: PLUGIN_ID,
        chainId: solana.id,
        name: 'Solana',
        icon: '/image/chains/solana.png',
        iconColor: '#5d6fc0',
        averageBlockDelay: 15,
        isMainnet: true,
    },
];
