/* cspell:disable */

import '@/app/globals.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import { headers } from 'next/headers.js';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { LayoutBody } from '@/app/layout-body.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator.js';
import { Agent, SiteCookies, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { IS_PRODUCTION } from '@/constants/static.js';
import { Script } from '@/esm/Script.js';
import { inter } from '@/fonts/inter.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getAgent } from '@/helpers/getAgent.js';
import { getCookie } from '@/helpers/getCookies.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export const metadata = createSiteMetadata('/');

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();

    const rootClass = await getCookie(SiteCookies.FireflyRootClass);
    const agent = await getAgent();
    const requestHeaders = await headers();

    const VERCEL_REGION = [
        `var VERCEL_IP_TIMEZONE = ${JSON.stringify(requestHeaders.get('x-vercel-ip-timezone'))};`,
        `var VERCEL_IP_CITY = ${JSON.stringify(requestHeaders.get('x-vercel-ip-city'))};`,
        `var VERCEL_IP_COUNTRY = ${JSON.stringify(requestHeaders.get('x-vercel-ip-country'))};`,
        `var VERCEL_IP_REGION = ${JSON.stringify(requestHeaders.get('x-vercel-ip-country-region'))};`,
    ];

    return (
        <html className={rootClass}>
            <head>
                <meta name="theme-color" content="#ffffff" />
                <meta name="googlebot" content="notranslate" />
                {IS_PRODUCTION ? null : <meta name="robots" content="noindex, nofollow" />}
                <Script src="/js/polyfills/base.js" strategy="beforeInteractive" />
                <Script>{VERCEL_REGION.join('\n')}</Script>
                {IS_PRODUCTION || env.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled ? (
                    <GoogleAnalytics gaId="G-61NFDTK6LT" />
                ) : null}
                {IS_PRODUCTION || env.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled ? (
                    <Script
                        src="/js/cookie3.analytics.js"
                        integrity="sha384-ihnQ09PGDbDPthGB3QoQ2Heg2RwQIDyWkHkqxMzq91RPeP8OmydAZbQLgAakAOfI"
                        crossOrigin="anonymous"
                        async
                        strategy="lazyOnload"
                        site-id="4e0dc4ab-2a63-4303-ad25-8aa14275d2d4"
                    />
                ) : null}
                <Script>
                    {`
                        setTimeout(function () {
                            const globalLoading = document.getElementById('global-loading');
                            if (globalLoading) {
                                globalLoading.style.display = 'none';
                            }
                        }, 1000 * 8)
                    `}
                </Script>
            </head>
            <body className={`${inter.variable} notranslate font-inter`}>
                <ErrorBoundary>
                    <LayoutBody agent={agent}>
                        <NuqsAdapter>{children}</NuqsAdapter>
                    </LayoutBody>
                </ErrorBoundary>

                {/* global loading */}
                {agent === Agent.FireflyApp ? null : <GlobalLoadingIndicator />}
            </body>
        </html>
    );
}
