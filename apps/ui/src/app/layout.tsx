import '#/app/globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Header } from '#/components/catalog/Header.js';
import { inter } from '#/fonts/inter.js';

export const metadata: Metadata = {
    title: 'Firefly UI',
    description: 'Component catalog for the Firefly design system.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Same theme cookie as apps/web (firefly_root_class), so this catalog matches
                    the visitor's site-wide preference when served at firefly.social/ui. */}
                {/* eslint-disable react/no-danger */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var c=document.cookie.match(/(?:^|;\\s*)firefly_root_class=([^;]*)/);var t=c?decodeURIComponent(c[1]):'light';if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light')}})();`,
                    }}
                />
                {/* eslint-enable react/no-danger */}
            </head>
            <body className={`${inter.variable} font-inter`}>
                <Header />
                {children}
            </body>
        </html>
    );
}
