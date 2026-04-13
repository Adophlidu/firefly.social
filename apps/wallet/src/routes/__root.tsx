import '@/globals.css';

import { createRootRoute, HeadContent, Outlet, ScriptOnce, Scripts } from '@tanstack/react-router';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { ClientProviders } from '@/components/ClientProviders.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { GlobalError } from '@/components/GlobalError.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { LoginRequired } from '@/components/LoginRequired.js';
import { ModalRouteLayer } from '@/components/ModalRouteLayer.js';
import { PrivyReadyRequired } from '@/components/PrivyReadyRequired.js';
import { RouteChangedHandler } from '@/components/RouteChangedHandler.js';
import { ThemeHandler } from '@/components/ThemeHandler.js';
import { Toaster } from '@/components/ui/sonner.js';
import { TooltipProvider } from '@/components/ui/tooltip.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { Modals } from '@/modals/index.js';

const rootSearchSchema = z.object({
    modal: z.nativeEnum(ModalType).optional(),
});

export const Route = createRootRoute({
    validateSearch: rootSearchSchema,
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Firefly Wallet' },
            { name: 'description', content: 'A modern wallet application' },
        ],
        links: [{ rel: 'icon', href: '/favicon.ico' }],
    }),
    component: RootLayout,
});

function RootLayout() {
    return (
        <RootDocument>
            <Outlet />
            <ModalRouteLayer />
        </RootDocument>
    );
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className="overscroll-contain" suppressHydrationWarning>
            <head>
                <HeadContent />
                <ScriptOnce>
                    {`
                        (function() {
                            try {
                                var s = localStorage.getItem('global-theme-state');
                                var m = s ? JSON.parse(s) : null;
                                var t = m && m.state && m.state.themeMode;
                                var d = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                                document.documentElement.classList.add(d ? 'dark' : 'light');
                            } catch (e) {
                                console.error('Error getting theme mode from localStorage', e.message);
                            }
                        })()`}
                </ScriptOnce>
            </head>
            <body className="bg-primaryBottom text-main mx-auto flex min-h-screen flex-col items-center">
                <div className="flex w-full max-w-[800px] flex-1 flex-col items-center">
                    <LinguiClientProvider>
                        <ClientProviders>
                            <NuqsAdapter>
                                <LoginRequired>
                                    <PrivyReadyRequired>
                                        <TooltipProvider>
                                            <ThemeHandler />
                                            <Toaster />
                                            <RouteChangedHandler />
                                            <ErrorBoundary fallback={GlobalError}>
                                                {children}
                                                <Modals />
                                            </ErrorBoundary>
                                        </TooltipProvider>
                                    </PrivyReadyRequired>
                                </LoginRequired>
                            </NuqsAdapter>
                        </ClientProviders>
                    </LinguiClientProvider>
                </div>
                <Scripts />
            </body>
        </html>
    );
}
