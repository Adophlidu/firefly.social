import '@/globals.css';

import { ClientScripts, ClientStyles, HeadOutlet, SsrDataOutlet, useRouterState } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ClientProviders } from '@/components/ClientProviders.js';
import { DefaultPendingComponent } from '@/components/DefaultPendingComponent.js';
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
import { cn } from '@/lib/utils.js';
import { Modals } from '@/modals/index.js';

export function head() {
    return {
        title: 'Firefly Wallet',
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { name: 'description', content: 'A modern wallet application' },
        ],
        links: [{ rel: 'icon', href: '/favicon.ico' }],
    };
}

/**
 * Rendered for client-only routes on the server (see the `clientOnly`
 * option in vite.config.ts): the server streams this shell and the client
 * swaps in the real page after hydration.
 */
export const pendingComponent = DefaultPendingComponent;

export default function RootLayout({ children }: { children?: ReactNode }) {
    return (
        <RootDocument>
            {children}
            <ModalRouteLayer />
        </RootDocument>
    );
}

const themeInitScript = `
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
})()`;

/**
 * react-native-web manages its atomic stylesheet imperatively: on the client
 * it reuses the `<style id="react-native-stylesheet">` element already in the
 * DOM, inserting it when missing. If the server doesn't render that element,
 * the client inserts it before hydration and React reports a mismatch.
 * Render it on both sides (RNW's standard SSR pattern); the text content is
 * suppressed because rule order may legitimately differ post-hydration.
 */
function ReactNativeStyleElement() {
    const sheet = StyleSheet.getSheet();
    return <style id={sheet.id} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: sheet.textContent }} />;
}

function RootDocument({ children }: { children: ReactNode }) {
    const { pathname } = useRouterState();
    const isPerpsRoute = pathname.startsWith('/perps');

    return (
        <html
            lang="en"
            className={cn('overscroll-contain', isPerpsRoute && 'h-full overflow-hidden')}
            suppressHydrationWarning
        >
            <head>
                <HeadOutlet />
                <ClientStyles />
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                <ReactNativeStyleElement />
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
                        </ClientProviders>
                    </LinguiClientProvider>
                </div>
                <SsrDataOutlet />
                <ClientScripts />
            </body>
        </html>
    );
}
