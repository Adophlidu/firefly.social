import '@/globals.css';

import { APP_BASE_PATH } from '@dimensiondev/envs/wallet';
import { createRootRoute, HeadContent, Outlet, ScriptOnce, Scripts, useLocation } from '@tanstack/react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { ClientProviders } from '@/components/ClientProviders.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { GlobalError } from '@/components/GlobalError.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { LoginRequired } from '@/components/LoginRequired.js';
import { ModalRouteLayer } from '@/components/ModalRouteLayer.js';
import { PerpsProvider } from '@/components/Perps/PerpsProvider.js';
import { PrivyReadyRequired } from '@/components/PrivyReadyRequired.js';
import { RouteChangedHandler } from '@/components/RouteChangedHandler.js';
import { ThemeHandler } from '@/components/ThemeHandler.js';
import { Toaster } from '@/components/ui/sonner.js';
import { TooltipProvider } from '@/components/ui/tooltip.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { cn } from '@/lib/utils.js';
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
    const { pathname } = useLocation();
    const route = `${APP_BASE_PATH}${pathname}`;
    const isPerpsRoute = pathname.startsWith('/perps');

    return (
        <html
            lang="en"
            className={cn('overscroll-contain', isPerpsRoute && 'h-full overflow-hidden')}
            suppressHydrationWarning
        >
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
            <body
                className={cn(
                    'mx-auto flex min-h-screen flex-col items-center bg-primaryBottom text-main',
                    isPerpsRoute && 'h-full min-h-0 overflow-hidden',
                )}
            >
                <div
                    className={cn(
                        'flex w-full max-w-[800px] flex-1 flex-col items-center',
                        isPerpsRoute && 'min-h-0 overflow-hidden',
                    )}
                >
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
                                                <PerpsProvider>
                                                    {children}
                                                    <Modals />
                                                </PerpsProvider>
                                            </ErrorBoundary>
                                        </TooltipProvider>
                                    </PrivyReadyRequired>
                                </LoginRequired>
                            </NuqsAdapter>
                        </ClientProviders>
                    </LinguiClientProvider>
                </div>
                <SpeedInsights route={route} />
                <Analytics route={route} path={route} />
                <Scripts />
            </body>
        </html>
    );
}
