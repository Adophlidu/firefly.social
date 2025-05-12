import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { i18n } from '@lingui/core';
import { setupLocalForClient } from '@/i18n/index.js';
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

i18n.activate('en');
export const decorators = [
    (Story) => {
        return (
            <LinguiClientProvider>
                <QueryClientProvider client={queryClient}>
                    <Story />
                </QueryClientProvider>
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
