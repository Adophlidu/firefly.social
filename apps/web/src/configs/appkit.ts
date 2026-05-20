/* cspell:disable */

'use client';

import { IS_PRODUCTION } from '@dimensiondev/constants';
import { SITE_DESCRIPTION, SITE_NAME } from '@dimensiondev/constants/static';
import { envs, SITE_URL } from '@dimensiondev/envs/web';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { lens, lensTestnet } from 'viem/chains';

import { solanaAdapter, solanaNetworks } from '@/configs/solanaClient.js';
import { wagmiAdapter, wagmiNetworks } from '@/configs/wagmiClient.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { WalletId } from '@/constants/reown.js';

const networks = [...wagmiNetworks, ...solanaNetworks] as [AppKitNetwork, ...AppKitNetwork[]];

const metadata = {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    icons: ['/image/firefly-light-avatar.png'],
};

const walletIds = IS_MOBILE_DEVICE
    ? [WalletId.CoinBase, WalletId.Rainbow, WalletId.OKX, WalletId.MetaMask, WalletId.Phantom]
    : [WalletId.MetaMask, WalletId.Rabby, WalletId.OKX, WalletId.Phantom, WalletId.Solflare];

export const appkit = createAppKit({
    adapters: [wagmiAdapter, solanaAdapter],
    networks,
    metadata,
    projectId: envs.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    showWallets: false,
    features: {
        email: false,
        socials: [],
    },
    debug: !IS_PRODUCTION,
    featuredWalletIds: walletIds,
    themeVariables: {
        '--w3m-border-radius-master': '1px',
    },
    chainImages: {
        [lens.id]: '/image/chains/lens.png',
        [lensTestnet.id]: '/image/chains/lens.png',
    },
});
