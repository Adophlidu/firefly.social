import { envs } from '@dimensiondev/envs/wallet';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';

import { solanaAdapter, solanaNetworks } from '@/configs/solanaClient.js';
import { wagmiAdapter, wagmiNetworks } from '@/configs/wagmiClient.js';

const networks = [...wagmiNetworks, ...solanaNetworks] as [AppKitNetwork, ...AppKitNetwork[]];

export const appkit = createAppKit({
    adapters: [wagmiAdapter, solanaAdapter],
    networks,
    projectId: envs.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    showWallets: false,
    features: {
        email: false,
        socials: [],
    },
});
