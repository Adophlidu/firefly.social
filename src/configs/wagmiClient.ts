/* cspell:disable */

'use client';

import { envs } from '@dimensiondev/envs';
import {
    type AppKitNetwork,
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
    linea,
    mainnet,
    metis,
    monadTestnet,
    optimism,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { plasma } from 'viem/chains';
import { http } from 'wagmi';

import { hyperEVM, lensMainnet, lensTestnet } from '@/configs/chains.js';
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
    lensMainnet,
    lensTestnet,
    celo,
    zkSync,
    linea,
    monadTestnet,
    plasma,
    hyperEVM,
] as AppKitNetwork[];

const privyConnector = createPrivyConnector();

export const wagmiAdapter = new WagmiAdapter({
    projectId: envs.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    networks: wagmiNetworks,
    transports: {
        [fantom.id]: http('https://rpc.ftm.tools'),
    },
    connectors: [privyConnector],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
