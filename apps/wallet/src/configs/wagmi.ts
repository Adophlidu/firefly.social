import { createConfig } from '@privy-io/wagmi';
import { createStorage } from '@wagmi/core';
import { http } from 'viem';
import {
    arbitrum,
    avalanche,
    base,
    blast,
    bsc,
    celo,
    linea,
    mainnet,
    optimism,
    plasma,
    polygon,
    scroll,
    zkSync,
} from 'viem/chains';

import { chains, lensMainnet, lensTestnet } from '@/configs/chains.js';
import { env } from '@/constants/env.js';

const storage = createStorage({
    key: 'firefly-wallet',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

export const config = createConfig({
    chains,
    transports: {
        [mainnet.id]: http(env.external.NEXT_PUBLIC_MAINNET_RPC_URL),
        [base.id]: http(),
        [bsc.id]: http(),
        [optimism.id]: http(env.external.NEXT_PUBLIC_OPTIMISM_RPC_URL),
        [polygon.id]: http(env.external.NEXT_PUBLIC_POLYGON_RPC_URL),
        [avalanche.id]: http(),
        [blast.id]: http(),
        [scroll.id]: http(),
        [linea.id]: http(),
        [arbitrum.id]: http(),
        [zkSync.id]: http(),
        [celo.id]: http(),
        [plasma.id]: http(),
        [lensMainnet.id]: http(),
        [lensTestnet.id]: http(),
    },
    storage,
});
