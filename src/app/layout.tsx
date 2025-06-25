/* cspell:disable */

import '@/app/globals.css';
import '@dialectlabs/blinks/index.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import { headers } from 'next/headers.js';
import type { ReactNode } from 'react';

import { LayoutBody } from '@/app/layout-body.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { SiteCookies } from '@/constants/enum.js';
import { IS_PRODUCTION } from '@/constants/index.js';
import { Script } from '@/esm/Script.js';
import { inter } from '@/fonts/index.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getCookie } from '@/helpers/getCookies.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export const metadata = createSiteMetadata();

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();

    const rootClass = await getCookie(SiteCookies.FireflyRootClass);
    const requestHeaders = await headers();

    const VERCEL_REGION = [
        `var VERCEL_IP_TIMEZONE = ${JSON.stringify(requestHeaders.get('x-vercel-ip-timezone'))};`,
        `var VERCEL_IP_CITY = ${JSON.stringify(requestHeaders.get('x-vercel-ip-city'))};`,
        `var VERCEL_IP_COUNTRY = ${JSON.stringify(requestHeaders.get('x-vercel-ip-country'))};`,
        `var VERCEL_IP_REGION = ${JSON.stringify(requestHeaders.get('x-vercel-ip-country-region'))};`,
    ];

    return (
        <html className={`font-loading ${rootClass}`}>
            <head>
                <Script src="/js/polyfills/base.js" strategy="beforeInteractive" />
                {IS_PRODUCTION ? <Script src="/js/safary.js" defer /> : null}
                <Script>{VERCEL_REGION.join('\n')}</Script>
                <Script
                    src="/js/cookie3.analytics.js"
                    integrity="sha384-ihnQ09PGDbDPthGB3QoQ2Heg2RwQIDyWkHkqxMzq91RPeP8OmydAZbQLgAakAOfI"
                    crossOrigin="anonymous"
                    async
                    strategy="lazyOnload"
                    site-id="4e0dc4ab-2a63-4303-ad25-8aa14275d2d4"
                />
                <GoogleAnalytics gaId="G-61NFDTK6LT" />
                <meta name="theme-color" content="#ffffff" />
                <meta name="googlebot" content="notranslate" />
                {/* for ssr purpose */}
                <meta name="apple-itunes-apps" content="app-id=6445781203" />
                {IS_PRODUCTION ? null : <meta name="robots" content="noindex, nofollow" />}
            </head>
            <body className={`${inter.variable} notranslate font-inter`}>
                <ErrorBoundary>
                    <LayoutBody>{children}</LayoutBody>
                </ErrorBoundary>
            </body>
        </html>
    );
}
