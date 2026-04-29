import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createStorage } from '@wagmi/core';
import { http } from 'viem';
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

import { createPrivyWalletConnector } from '@/connectors/createPrivyWalletConnector.js';
import { env } from '@/constants/env.js';

const storage = createStorage({
    key: 'firefly-wallet',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

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

export const wagmiAdapter = new WagmiAdapter({
    projectId: env.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    networks: wagmiNetworks,
    transports: {
        [mainnet.id]: http(env.external.NEXT_PUBLIC_MAINNET_RPC_URL),
        [optimism.id]: http(env.external.NEXT_PUBLIC_OPTIMISM_RPC_URL),
        [polygon.id]: http(env.external.NEXT_PUBLIC_POLYGON_RPC_URL),
        [fantom.id]: http('https://rpc.ftm.tools'),
    },
    storage,
    connectors: [createPrivyWalletConnector()],
});

export const config = wagmiAdapter.wagmiConfig;
