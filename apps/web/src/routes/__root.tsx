import '@/app/globals.css';

import { SITE_DESCRIPTION, SITE_NAME } from '@dimensiondev/constants/static';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { ClientScripts, ClientStyles, HeadOutlet, SsrDataOutlet } from '@dimensiondev/ssr';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import type { ReactNode } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';

const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
const TELEMETRY_ENABLED = IS_PRODUCTION || envs.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled;

/**
 * Equivalent of `metadata = createSiteMetadata('/')` + `viewport` in
 * src/app/layout.tsx, expressed in the SSR library's head() contract.
 * `createSiteMetadata` itself returns Next's Metadata shape, so the fields
 * are mapped by hand here; keep them in sync when the Next layout changes.
 */
export function head() {
    const ogImage = getDefaultOgImageUrl();
    return {
        title: SITE_NAME,
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
            { name: 'description', content: SITE_DESCRIPTION },
            // Videos from twitter can not play on firefly, so we add this to fix
            { name: 'referrer', content: 'no-referrer' },
            { name: 'theme-color', content: '#ffffff' },
            { name: 'googlebot', content: 'notranslate' },
            ...(IS_PRODUCTION ? [] : [{ name: 'robots', content: 'noindex, nofollow' }]),
            { property: 'og:title', content: SITE_NAME },
            { property: 'og:description', content: SITE_DESCRIPTION },
            { property: 'og:site_name', content: SITE_NAME },
            { property: 'og:image', content: ogImage },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: SITE_NAME },
            { name: 'twitter:description', content: SITE_DESCRIPTION },
            { name: 'twitter:creator', content: '@thefireflyapp' },
            { name: 'twitter:image', content: ogImage },
            { name: 'itunes:app_id', content: '1640183078' },
        ],
        links: [
            { rel: 'manifest', href: '/site.webmanifest' },
            { rel: 'icon', href: '/favicon.ico' },
            { rel: 'icon', href: '/android-chrome-192x192.png', type: 'image/png' },
            { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        ],
    };
}

/**
 * next/font/google (`@/fonts/inter.js`) is Next-only. The same Inter faces are
 * already shipped in public/font, so register them with @font-face and define
 * the --font-inter variable that tailwind's `font-inter` utility consumes.
 */
const fontFaces = `
@font-face { font-family: 'Inter'; src: url('/font/Inter-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/font/Inter-Bold.ttf') format('truetype'); font-weight: 700; font-style: normal; font-display: swap; }
:root { --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif; }
`;

/* Inline theme script — executes synchronously during HTML parsing, before any paint */
/* Keep in sync with src/app/layout.tsx and apps/web/src/proxy/handlers/cspHandler.ts */
const themeInitScript = `(function(){var c=document.cookie.match(/(?:^|;\\s*)firefly_root_class=([^;]*)/);var t=c?decodeURIComponent(c[1]):'light';if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light')}})();`;

const GA_ID = 'G-61NFDTK6LT';
const gaInitScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`;

export default function RootLayout({ children }: { children?: ReactNode }) {
    // The @next/next/* rules below assume Next.js primitives; this file renders
    // the document for the @dimensiondev/ssr runtime instead.
    /* eslint-disable @next/next/no-head-element, @next/next/no-sync-scripts */
    return (
        <html suppressHydrationWarning>
            <head>
                <HeadOutlet />
                <ClientStyles />
                {/* eslint-disable react/no-danger */}
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                <style dangerouslySetInnerHTML={{ __html: fontFaces }} />
                {/* eslint-enable react/no-danger */}
                {/* Static scripts generated into public/js by .vercel-config/build-scripts.mjs
                    and build-polyfills.sh (run `pnpm build:scripts` / `build:polyfills` first). */}
                <script src="/js/home-redirect.js" />
                <script src="/js/polyfills/base.js" />
                {TELEMETRY_ENABLED ? (
                    <>
                        {/* @next/third-parties/google is Next-only; emit the equivalent gtag snippet. */}
                        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
                        {/* eslint-disable-next-line react/no-danger */}
                        <script dangerouslySetInnerHTML={{ __html: gaInitScript }} />
                    </>
                ) : null}
            </head>
            <body className="notranslate font-inter">
                <ErrorBoundary>{children}</ErrorBoundary>
                {TELEMETRY_ENABLED ? <SpeedInsights /> : null}
                {TELEMETRY_ENABLED ? <Analytics /> : null}
                <SsrDataOutlet />
                <ClientScripts />
            </body>
        </html>
    );
    /* eslint-enable @next/next/no-head-element, @next/next/no-sync-scripts */
}
