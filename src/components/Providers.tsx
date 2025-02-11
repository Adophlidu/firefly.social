import { memo, type PropsWithChildren } from 'react';

import { InitialProviders } from '@/components/InitialProviders.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { QueryClientProviders } from '@/components/QueryClientProviders.js';
import { SolanaWalletAdapterProvider } from '@/components/SolanaWalletAdapterProvider.js';
import { WagmiProvider } from '@/components/WagmiProvider.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

type ProviderProps = PropsWithChildren<{
    enableInsights?: boolean;
}>;

export const Providers = memo(async function RootProviders({ enableInsights = false, ...props }: ProviderProps) {
    await setupLocaleForSSR();

    return (
        <LinguiClientProvider>
            <QueryClientProviders>
                <InitialProviders>
                    <SolanaWalletAdapterProvider enableInsights={enableInsights}>
                        <WagmiProvider enableInsights={enableInsights}>{props.children}</WagmiProvider>
                    </SolanaWalletAdapterProvider>
                </InitialProviders>
            </QueryClientProviders>
        </LinguiClientProvider>
    );
});
