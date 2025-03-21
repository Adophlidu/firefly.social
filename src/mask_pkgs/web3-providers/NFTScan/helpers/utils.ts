import { NetworkPluginID } from '@/constants/enum.js';
import { ChainId } from '@masknet/web3-shared-evm';
import type { Web3Helper } from '@masknet/web3-helpers';

export function resolveNFTScanHostName(pluginId: NetworkPluginID, chainId: Web3Helper.ChainIdAll) {
    if (pluginId === NetworkPluginID.PLUGIN_SOLANA) return 'https://solana.nftscan.com';

    switch (chainId) {
        case ChainId.Mainnet:
            return 'https://www.nftscan.com';
        case ChainId.Polygon:
            return 'https://polygon.nftscan.com';
        case ChainId.BSC:
            return 'https://bnb.nftscan.com';
        case ChainId.Arbitrum:
            return 'https://arbitrum.nftscan.com';
        case ChainId.Avalanche:
            return 'https://avax.nftscan.com';
        case ChainId.Optimism:
            return 'https://optimism.nftscan.com';
        case ChainId.xDai:
            return 'https://gnosis.nftscan.com';
        case ChainId.Moonbeam:
            return 'https://moonbeam.nftscan.com';
        default:
            return '';
    }
}
