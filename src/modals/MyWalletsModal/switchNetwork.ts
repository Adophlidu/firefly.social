import { CoreChainController } from '@reown/appkit';
import { type AppKitNetwork, mainnet, solana } from '@reown/appkit/networks';

import { appkit, networks } from '@/configs/wagmiClient.js';
import type { ChainNamespace } from '@/types/index.js';

export function switchNetwork(namespace: ChainNamespace, chainId?: number): AppKitNetwork | undefined {
    const targetNetwork =
        namespace === 'eip155'
            ? chainId
                ? networks.find((x) => x.id === chainId) || mainnet
                : mainnet
            : namespace === 'solana'
              ? solana
              : undefined;
    if (targetNetwork) {
        CoreChainController.setActiveNamespace(namespace);
        appkit.switchNetwork(targetNetwork);
    }

    return targetNetwork;
}
