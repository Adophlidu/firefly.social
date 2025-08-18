import { type AppKitNetwork, mainnet, solana } from '@reown/appkit/networks';

import { appkit } from '@/configs/appkit.js';
import { wagmiNetworks } from '@/configs/wagmiClient.js';
import type { ChainNamespace } from '@/types/utility.js';

export async function switchNetwork(namespace: ChainNamespace, chainId?: number): Promise<AppKitNetwork | undefined> {
    const targetNetwork =
        namespace === 'eip155'
            ? chainId
                ? wagmiNetworks.find((x) => x.id === chainId) || mainnet
                : mainnet
            : namespace === 'solana'
              ? solana
              : undefined;
    if (targetNetwork) appkit.switchNetwork(targetNetwork);

    return targetNetwork;
}
