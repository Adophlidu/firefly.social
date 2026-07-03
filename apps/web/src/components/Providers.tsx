import { memo, type PropsWithChildren } from 'react';

import { InitialProviders } from '@/components/InitialProviders.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { QueryClientProviders } from '@/components/QueryClientProviders.js';
import { WalletStackBoundary } from '@/components/WalletStackBoundary.js';

type ProviderProps = PropsWithChildren<{ locale?: string }>;

export const Providers = memo(function RootProviders(props: ProviderProps) {
    return (
        <LinguiClientProvider locale={props.locale}>
            {/* Query sits above the (deferred) wagmi boundary because wagmi hooks
                depend on a QueryClient ancestor. */}
            <QueryClientProviders>
                <InitialProviders>
                    <WalletStackBoundary>{props.children}</WalletStackBoundary>
                </InitialProviders>
            </QueryClientProviders>
        </LinguiClientProvider>
    );
});
