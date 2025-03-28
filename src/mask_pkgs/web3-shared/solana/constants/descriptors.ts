import { NetworkPluginID } from '@/constants/enum.js';
import {
    type ChainDescriptor,
    createFungibleToken,
    type NetworkDescriptor,
} from '@/mask_pkgs/web3-shared/base/index.js';
import { getTokenConstant } from '@/mask_pkgs/web3-shared/solana/constants/constants.js';
import { SolanaChainId, SolanaNetworkType, SolanaSchemaType } from '@/mask_pkgs/web3-shared/solana/types.js';

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
            getTokenConstant(SolanaChainId.Mainnet, 'SOL_ADDRESS', ''),
            'Solana',
            'SOL',
            9,
            'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        ),
        explorerUrl: {
            url: 'https://explorer.solana.com/',
        },
        rpcUrl: '',
        iconUrl: new URL('../assets/solana.png', import.meta.url).href,
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
        icon: new URL('../assets/solana.png', import.meta.url).href,
        iconColor: '#5d6fc0',
        averageBlockDelay: 15,
        isMainnet: true,
    },
];
