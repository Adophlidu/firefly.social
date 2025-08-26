import type { NetworkPluginID } from '@/constants/enum.js';
import { getRegisteredWeb3Networks } from '@/web3-providers/Manager/index.js';

export function getNetworkDescriptor(expectedPluginID: NetworkPluginID, expectedChainId?: number) {
    return getRegisteredWeb3Networks(expectedPluginID).find((x) => x.chainId === expectedChainId);
}
