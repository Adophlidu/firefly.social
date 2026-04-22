import { solana, solanaChains, solanaDevnet, solanaTestnet } from '@dimensiondev/web3/chains';

import { NetworkPluginID } from '@/constants/enum.js';
import type { NetworkDescriptor } from '@/web3-shared/base/specs.js';

const PLUGIN_ID = NetworkPluginID.PLUGIN_SOLANA;

interface ChainMeta {
    name: string;
    shortName?: string;
    icon: string;
    iconColor: string;
    averageBlockDelay?: number;
    network: 'mainnet' | 'testnet';
    explorerUrl: string;
}

const CHAIN_META: Record<number, ChainMeta> = {
    [solana.id]: {
        name: 'Solana',
        shortName: 'Solana',
        icon: '/image/chains/solana.png',
        iconColor: '#5d6fc0',
        averageBlockDelay: 15,
        network: 'mainnet',
        explorerUrl: 'https://explorer.solana.com/',
    },
    [solanaTestnet.id]: {
        name: 'Solana Testnet',
        shortName: 'Solana',
        icon: '/image/chains/solana.png',
        iconColor: '#5d6fc0',
        averageBlockDelay: 15,
        network: 'testnet',
        explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
    },
    [solanaDevnet.id]: {
        name: 'Solana Devnet',
        shortName: 'Solana',
        icon: '/image/chains/solana.png',
        iconColor: '#5d6fc0',
        averageBlockDelay: 15,
        network: 'testnet',
        explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    },
};

export const NETWORK_DESCRIPTORS: ReadonlyArray<NetworkDescriptor<number>> = solanaChains.map(
    (chain): NetworkDescriptor<number> => {
        const meta = CHAIN_META[chain.id];
        return {
            ID: `${PLUGIN_ID}_${meta.name.toLowerCase().replace(/\s+/g, '_')}`,
            networkSupporterPluginID: PLUGIN_ID,
            chainId: chain.id,
            name: meta.name,
            shortName: meta.shortName,
            icon: meta.icon,
            iconColor: meta.iconColor as NetworkDescriptor<number>['iconColor'],
            averageBlockDelay: meta.averageBlockDelay ?? 15,
            isMainnet: meta.network === 'mainnet',
        };
    },
);
