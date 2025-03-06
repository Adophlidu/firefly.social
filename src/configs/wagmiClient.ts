/* cspell:disable */

'use client';

import {
    type AppKitNetwork,
    arbitrum,
    aurora,
    avalanche,
    base,
    bsc,
    confluxESpace,
    fantom,
    gnosis,
    mainnet,
    metis,
    optimism,
    polygon,
    scroll,
    xLayer,
    zora,
} from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'wagmi';
import {
    arbitrum as wagmiArbitrum,
    aurora as wagmiAurora,
    avalanche as wagmiAvalanche,
    base as wagmiBase,
    bsc as wagmiBsc,
    confluxESpace as wagmiConfluxESpace,
    degen as wagmiDegen,
    fantom as wagmiFantom,
    gnosis as wagmiGnosis,
    mainnet as wagmiMainnet,
    metis as wagmiMetis,
    optimism as wagmiOptimism,
    polygon as wagmiPolygon,
    scroll as wagmiScroll,
    xLayer as wagmiXLayer,
    zora as wagmiZora,
} from 'wagmi/chains';

import { solanaAdapter, solanaNetworks } from '@/configs/solanaWallets.js';
import { IS_MOBILE_DEVICE } from '@/constants/bowser.js';
import { VERCEL_NEV } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/index.js';
import { WalletId } from '@/constants/reown.js';

export const networks = [
    mainnet,
    base,
    bsc,
    polygon,
    optimism,
    arbitrum,
    gnosis,
    avalanche,
    aurora,
    confluxESpace,
    fantom,
    xLayer,
    metis,
    zora,
    scroll,
    ...solanaNetworks,
] as [AppKitNetwork, ...AppKitNetwork[]];

export const chains = [
    wagmiMainnet,
    wagmiBase,
    wagmiBsc,
    wagmiDegen,
    wagmiPolygon,
    wagmiOptimism,
    wagmiArbitrum,
    wagmiGnosis,
    wagmiAvalanche,
    wagmiAurora,
    wagmiConfluxESpace,
    wagmiFantom,
    wagmiXLayer,
    wagmiMetis,
    wagmiZora,
    wagmiScroll,
] as const;

export const adapter = new WagmiAdapter({
    projectId: env.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    networks,
    transports: {
        [fantom.id]: http('https://rpc.ftm.tools'),
    },
});

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
    adapters: [adapter, solanaAdapter],
    networks,
    metadata,
    projectId: env.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    showWallets: false,
    features: {
        email: false,
        socials: [],
    },
    debug: env.external.NEXT_PUBLIC_VERCEL_ENV !== VERCEL_NEV.Production,
    featuredWalletIds: walletIds,
    themeVariables: {
        '--w3m-border-radius-master': '1px',
    },
});

export const config = adapter.wagmiConfig;
