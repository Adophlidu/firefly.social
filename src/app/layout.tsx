/* cspell:disable */

import '@/app/globals.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import { headers } from 'next/headers.js';
import type { ReactNode } from 'react';

import { LayoutBody } from '@/app/layout-body.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { Agent, SiteCookies } from '@/constants/enum.js';
import { IS_PRODUCTION } from '@/constants/index.js';
import { Script } from '@/esm/Script.js';
import { inter } from '@/fonts/inter.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getCookie } from '@/helpers/getCookies.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export const metadata = createSiteMetadata('/');

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

const size = 208; // Size of the loading indicator

export default async function RootLayout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();

    const rootClass = await getCookie(SiteCookies.FireflyRootClass);
    const agent = await getCookie(SiteCookies.Agent);
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
                <link rel="preload" href="/webm/global-loading.webm" as="video" type="video/webm" />
                {IS_PRODUCTION ? null : <meta name="robots" content="noindex, nofollow" />}
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
                    <LayoutBody>{children}</LayoutBody>
                </ErrorBoundary>

                {/* global loading */}
                {agent === Agent.FireflyApp ? null : (
                    <div id="global-loading" className="global-loading">
                        <div className="relative" style={{ width: size, height: size }}>
                            <svg
                                id="global-loading-preloader"
                                fill="none"
                                viewBox="0 0 31 40"
                                width={(85 / 208) * size}
                                height={size}
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                                <path d="m2.53624 0h2.53623v2.5h-2.53623z" fill="#e64cff" />
                                <path
                                    d="m7.60871 5h-2.53624v2.5h-2.53623v10h-2.53624v12.5h2.53624v5h2.53623v2.5h2.53624v2.5h15.21739v-2.5h2.5362v-2.5h2.5363v-2.5h2.5362v-12.5h-2.5362v-5h-2.5363v-5h-2.5362v-2.5h2.5362v-2.5h-2.5362v2.5h-2.5362v-2.5h-2.5363v-2.5h-5.0724v-2.5h-2.5363v5h2.5363v2.5h-2.5363v5h-2.53619v-2.5h-2.53624v-2.5h2.53624z"
                                    fill="#e64cff"
                                />
                                <path
                                    d="m15.2173 7.5h2.5362v2.5h2.5363v2.5h2.5362v5h2.5362v5h2.5362v10h-2.5362v2.5h-2.5362v2.5h-12.6812v-2.5h-5.07243v-5h-2.53624v-10h2.53624v-5h7.60873v-2.5h2.5362z"
                                    fill="#222ebb"
                                />
                                <path d="m7.60861 10h-2.53624v2.5h2.53624z" fill="#222ebb" />
                                <path d="m15.2172 12.5h2.5362v2.5h-2.5362z" fill="#6548f7" />
                                <path
                                    d="m22.8259 25v-5h-2.5362v-5h-2.5363v2.5h-5.0725v2.5h-2.5362v-2.5h-2.5362v5h-2.53623v12.5h5.07243v2.5h12.6812v-5h2.5362v-7.5z"
                                    fill="#6548f7"
                                />
                                <g fill="#fff">
                                    <path d="m17.7533 17.5h-2.5362v2.5h2.5362z" />
                                    <path
                                        clipRule="evenodd"
                                        d="m10.1446 22.5v2.5h-2.5362v10h2.5362v2.5h10.145v-2.5h2.5362v-10h-2.5362v-2.5zm0 5h2.5362v5h-2.5362zm10.145 5v-5h-2.5363v5z"
                                        fillRule="evenodd"
                                    />
                                </g>
                            </svg>
                        </div>
                    </div>
                )}
            </body>
        </html>
    );
}
