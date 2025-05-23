import { type AppKitNetwork, mainnet, solana } from '@reown/appkit/networks';

import { appkit, networks } from '@/configs/wagmiClient.js';
import type { ChainNamespace } from '@/types/index.js';

export async function switchNetwork(namespace: ChainNamespace, chainId?: number): Promise<AppKitNetwork | undefined> {
    const targetNetwork =
        namespace === 'eip155'
            ? chainId
                ? networks.find((x) => x.id === chainId) || mainnet
                : mainnet
            : namespace === 'solana'
              ? solana
              : undefined;
    if (targetNetwork) {
        await appkit.switchNetwork(targetNetwork);
    }

    return targetNetwork;
}
