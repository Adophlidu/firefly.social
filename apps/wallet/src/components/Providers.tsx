import '@/configs/appkit.js';

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { WagmiProvider } from 'wagmi';

import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { store } from '@/store/index.js';

export function Providers({ children }: PropsWithChildren) {
    return (
        <JotaiProvider store={store}>
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>{children}</WagmiProvider>
            </QueryClientProvider>
        </JotaiProvider>
    );
}
