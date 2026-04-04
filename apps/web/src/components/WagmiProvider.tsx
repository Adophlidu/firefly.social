'use client';

import { type ReactNode } from 'react';
import { WagmiProvider as WagmiProviderSDK } from 'wagmi';

import { wagmiConfig } from '@/configs/wagmiClient.js';

interface WagmiProviderProps {
    children: ReactNode;
}

export function WagmiProvider(props: WagmiProviderProps) {
    return <WagmiProviderSDK config={wagmiConfig}>{props.children}</WagmiProviderSDK>;
}
