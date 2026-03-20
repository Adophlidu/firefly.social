/* cspell:disable */

import '@/app/globals.css';

import { IS_PRODUCTION } from '@dimensiondev/constants';
import { GoogleAnalytics } from '@next/third-parties/google';
import { compact } from 'lodash-es';
import { cookies, headers } from 'next/headers.js';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode } from 'react';

import { LayoutBody } from '@/app/layout-body.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator.js';
import { Agent, Locale, SiteCookies, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { Script } from '@/esm/Script.js';
import { inter } from '@/fonts/inter.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getAgent } from '@/helpers/getAgent.js';
import { resolveLocale } from '@/helpers/getCookies.js';
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

    const requestCookies = await cookies();
    const rootClass = requestCookies.get(SiteCookies.FireflyRootClass)?.value;
    const rootLocale = requestCookies.get(SiteCookies.Locale)?.value;

    const requestHeaders = await headers();
    const agent = await getAgent(requestHeaders);

    const CSP_NONCE = requestHeaders.get('X-CSP-Nonce') || '';

    const IP_TIMEZONE = requestHeaders.get('x-vercel-ip-timezone');
    const IP_CITY = requestHeaders.get('x-vercel-ip-city');
    const IP_COUNTRY = requestHeaders.get('x-vercel-ip-country');
    const IP_REGION = requestHeaders.get('x-vercel-ip-country-region');

    const VERCEL_REGION = compact([
        IP_TIMEZONE ? `var VERCEL_IP_TIMEZONE = ${JSON.stringify(IP_TIMEZONE)};` : null,
        IP_CITY ? `var VERCEL_IP_CITY = ${JSON.stringify(IP_CITY)};` : null,
        IP_COUNTRY ? `var VERCEL_IP_COUNTRY = ${JSON.stringify(IP_COUNTRY)};` : null,
        IP_REGION ? `var VERCEL_IP_REGION = ${JSON.stringify(IP_REGION)};` : null,
    ]);

    return (
        <html lang={rootLocale ? resolveLocale(rootLocale) : Locale.en} className={rootClass}>
            <head>
                {/* Videos from twitter can not play on firefly, so we add this to fix */}
                <meta name="referrer" content="no-referrer" />
                <meta name="theme-color" content="#ffffff" />
                <meta name="googlebot" content="notranslate" />
                {IS_PRODUCTION ? null : <meta name="robots" content="noindex, nofollow" />}
                <Script src="/js/home-redirect.js" strategy="beforeInteractive" nonce={CSP_NONCE} />
                <Script src="/js/polyfills/base.js" strategy="beforeInteractive" nonce={CSP_NONCE} />
                {VERCEL_REGION.length ? <Script nonce={CSP_NONCE}>{VERCEL_REGION.join('\n')}</Script> : null}
                {IS_PRODUCTION || env.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled ? (
                    <GoogleAnalytics nonce={CSP_NONCE} gaId="G-61NFDTK6LT" />
                ) : null}
                <Script nonce={CSP_NONCE}>
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
