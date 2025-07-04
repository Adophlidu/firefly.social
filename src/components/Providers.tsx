'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { memo, type PropsWithChildren } from 'react';

import { InitialProviders } from '@/components/InitialProviders.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { QueryClientProviders } from '@/components/QueryClientProviders.js';
import { WagmiProvider } from '@/components/WagmiProvider.js';
import { env } from '@/constants/env.js';

type ProviderProps = PropsWithChildren<{}>;

export const Providers = memo(async function RootProviders(props: ProviderProps) {
    return (
        <LinguiClientProvider>
            <PrivyProvider appId={env.external.NEXT_PUBLIC_PRIVY_APP_ID}>
                <WagmiProvider>
                    <QueryClientProviders>
                        <InitialProviders>{props.children}</InitialProviders>
                    </QueryClientProviders>
                </WagmiProvider>
            </PrivyProvider>
        </LinguiClientProvider>
    );
});
