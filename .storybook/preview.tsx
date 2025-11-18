import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { WagmiProvider } from '@/components/WagmiProvider.js';
import { i18n } from '@lingui/core';
import type { Preview } from '@storybook/nextjs-vite';
import '../src/app/globals.css';
import { Buffer } from 'buffer';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

i18n.activate('en');
globalThis.Buffer = Buffer;
export const decorators = [
    (Story) => {
        return (
            <LinguiClientProvider>
                <WagmiProvider>
                    <QueryClientProvider client={queryClient}>
                        <Story />
                    </QueryClientProvider>
                </WagmiProvider>
            </LinguiClientProvider>
        );
    },
];

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
