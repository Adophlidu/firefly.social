/* cspell:disable */

import '@/app/globals.css';
import '@dialectlabs/blinks/index.css';

import { GoogleAnalytics } from '@next/third-parties/google';
// @ts-ignore skip
import { Inter } from 'next/font/google';

import { LayoutBody } from '@/app/layout-body.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { SiteCookies } from '@/constants/enum.js';
import { IS_PRODUCTION } from '@/constants/index.js';
import { Script } from '@/esm/Script.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getCookie } from '@/helpers/getCookies.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata = createSiteMetadata();

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    await setupLocaleForSSR();

    const rootClass = await getCookie(SiteCookies.FireflyRootClass);

    return (
        <html className={`font-loading ${rootClass}`}>
            <head>
                <Script src="/js/polyfills/base.js" strategy="beforeInteractive" />
                <Script src="/js/safary.js" defer />
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
