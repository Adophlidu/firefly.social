/* cspell:disable */

'use client';

import { envs } from '@dimensiondev/envs/web';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    baseSepolia,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    hyperEvm,
    lens,
    lensTestnet,
    linea,
    mainnet,
    metis,
    monadTestnet,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';
import { http } from 'wagmi';

import { createPrivyConnector } from '@/connectors/PrivyConnector.js';

export const wagmiNetworks = [
    mainnet,
    base,
    baseSepolia,
    bsc,
    polygon,
    optimism,
    arbitrum,
    gnosis,
    avalanche,
    blast,
    aurora,
    confluxESpace,
    fantom,
    xLayer,
    metis,
    zora,
    scroll,
    lens,
    lensTestnet,
    celo,
    zkSync,
    linea,
    monadTestnet,
    plasma,
    hyperEvm,
] as AppKitNetwork[];

const privyConnector = createPrivyConnector();

export const wagmiAdapter = new WagmiAdapter({
    projectId: envs.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    networks: wagmiNetworks,
    transports: {
        [mainnet.id]: http(envs.external.NEXT_PUBLIC_MAINNET_RPC_URL),
        [optimism.id]: http(envs.external.NEXT_PUBLIC_OPTIMISM_RPC_URL),
        [polygon.id]: http(envs.external.NEXT_PUBLIC_POLYGON_RPC_URL),
        [fantom.id]: http('https://rpc.ftm.tools'),
    },
    connectors: [privyConnector],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
