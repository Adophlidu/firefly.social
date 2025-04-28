/* cspell:disable */

import '@/app/globals.css';
import '@dialectlabs/blinks/index.css';

import { GoogleAnalytics } from '@next/third-parties/google';
// @ts-ignore skip
import { Inter } from 'next/font/google';

import { LayoutBody } from '@/app/layout-body.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { SiteCookies } from '@/constants/enum.js';
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
                <GoogleAnalytics gaId="G-61NFDTK6LT" />
                <meta name="theme-color" content="#ffffff" />
                <meta name="googlebot" content="notranslate" />
            </head>
            <body className={`${inter.variable} notranslate font-inter`}>
                <ErrorBoundary>
                    <LayoutBody>{children}</LayoutBody>
                </ErrorBoundary>
            </body>
        </html>
    );
}
