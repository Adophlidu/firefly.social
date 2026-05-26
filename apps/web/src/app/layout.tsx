/* cspell:disable */

import '@/app/globals.css';

import { IS_PRODUCTION } from '@dimensiondev/constants';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { ReactNode } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator.js';
import { Script } from '@/esm/Script.js';
import { inter } from '@/fonts/inter.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/');

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html suppressHydrationWarning>
            <head>
                {/* Videos from twitter can not play on firefly, so we add this to fix */}
                <meta name="referrer" content="no-referrer" />
                <meta name="theme-color" content="#ffffff" />
                <meta name="googlebot" content="notranslate" />
                {IS_PRODUCTION ? null : <meta name="robots" content="noindex, nofollow" />}
                {/* Inline theme script — executes synchronously during HTML parsing, before any paint */}
                {/* Update apps/web/src/proxy/handlers/cspHandler.ts if you edit the script */}
                {/* eslint-disable react/no-danger */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var c=document.cookie.match(/(?:^|;\\s*)firefly_root_class=([^;]*)/);var t=c?decodeURIComponent(c[1]):'light';if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light')}})();`,
                    }}
                />
                {/* eslint-enable react/no-danger */}
                <Script src="/js/home-redirect.js" strategy="beforeInteractive" />
                <Script src="/js/polyfills/base.js" strategy="beforeInteractive" />
                <Script src="/js/global-loading-timeout.js" strategy="beforeInteractive" />
                {IS_PRODUCTION || envs.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled ? (
                    <GoogleAnalytics gaId="G-61NFDTK6LT" />
                ) : null}
            </head>
            <body className={`${inter.variable} notranslate font-inter`}>
                <ErrorBoundary>{children}</ErrorBoundary>
                <GlobalLoadingIndicator />
                {IS_PRODUCTION || envs.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled ? (
                    <>
                        <Analytics />
                        <SpeedInsights />
                    </>
                ) : null}
            </body>
        </html>
    );
}
