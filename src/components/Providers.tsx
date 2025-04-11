import { memo, type PropsWithChildren } from 'react';

import { InitialProviders } from '@/components/InitialProviders.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { QueryClientProviders } from '@/components/QueryClientProviders.js';
import { SentryProvider } from '@/components/SentryProvider.js';
import { WagmiProvider } from '@/components/WagmiProvider.js';

type ProviderProps = PropsWithChildren<{}>;

export const Providers = memo(async function RootProviders(props: ProviderProps) {
    return (
        <LinguiClientProvider>
            <SentryProvider>
                <WagmiProvider>
                    <QueryClientProviders>
                        <InitialProviders>{props.children}</InitialProviders>
                    </QueryClientProviders>
                </WagmiProvider>
            </SentryProvider>
        </LinguiClientProvider>
    );
});
