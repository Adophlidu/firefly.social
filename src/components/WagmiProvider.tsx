'use client';

import { WagmiProvider as WagmiProviderSDK } from 'wagmi';

import { config } from '@/configs/wagmiClient.js';

export interface WagmiProviderProps {
    children: React.ReactNode;
}

export function WagmiProvider(props: WagmiProviderProps) {
    return <WagmiProviderSDK config={config}>{props.children}</WagmiProviderSDK>;
}
