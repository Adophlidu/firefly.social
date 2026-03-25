/* cspell:disable */

'use client';

import { IS_PRODUCTION } from '@dimensiondev/constants';
import { envs } from '@dimensiondev/envs';
import { type AppKitNetwork } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';

import { lensMainnet, lensTestnet } from '@/configs/chains.js';
import { solanaAdapter, solanaNetworks } from '@/configs/solanaClient.js';
import { wagmiAdapter, wagmiNetworks } from '@/configs/wagmiClient.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { WalletId } from '@/constants/reown.js';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/static.js';

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
        [lensMainnet.id]: '/image/chains/lens.png',
        [lensTestnet.id]: '/image/chains/lens.png',
    },
});
