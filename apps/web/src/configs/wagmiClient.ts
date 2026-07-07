/* cspell:disable */

'use client';

import { ETHEREUM_RPC_URL, OPTIMISM_RPC_URL, POLYGON_RPC_URL } from '@dimensiondev/constants/static';
import { envs } from '@dimensiondev/envs/web';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { fantom, mainnet, optimism, polygon } from 'viem/chains';
import { http } from 'wagmi';

import { wagmiChains } from '@/configs/wagmiChains.js';
import { registerWagmiConfig } from '@/configs/wagmiConfigHolder.js';
import { createPrivyConnector } from '@/connectors/PrivyConnector.js';

export const wagmiNetworks = [...wagmiChains] as AppKitNetwork[];

const privyConnector = createPrivyConnector();

export const wagmiAdapter = new WagmiAdapter({
    projectId: envs.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    networks: wagmiNetworks,
    // Keep in sync with `wagmiTransportUrls` in configs/wagmiChains.ts, which the
    // fallback config uses for the same chains. Chains not listed here use the
    // transport the AppKit adapter derives for them.
    transports: {
        [mainnet.id]: http(ETHEREUM_RPC_URL),
        [optimism.id]: http(OPTIMISM_RPC_URL),
        [polygon.id]: http(POLYGON_RPC_URL),
        [fantom.id]: http('https://rpc.ftm.tools'),
    },
    connectors: [privyConnector],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Make the real config available to synchronous read paths that otherwise use
// the fallback config (see configs/wagmiConfigHolder.ts).
registerWagmiConfig(wagmiConfig);
