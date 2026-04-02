import { memo, type PropsWithChildren } from 'react';

import { InitialProviders } from '@/components/InitialProviders.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { QueryClientProviders } from '@/components/QueryClientProviders.js';
import { WagmiProvider } from '@/components/WagmiProvider.js';

type ProviderProps = PropsWithChildren<{ locale?: string }>;

export const Providers = memo(function RootProviders(props: ProviderProps) {
    return (
        <LinguiClientProvider locale={props.locale}>
            <WagmiProvider>
                <QueryClientProviders>
                    <InitialProviders>{props.children}</InitialProviders>
                </QueryClientProviders>
            </WagmiProvider>
        </LinguiClientProvider>
    );
});
