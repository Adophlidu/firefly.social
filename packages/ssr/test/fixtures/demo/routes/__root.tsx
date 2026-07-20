import { ClientScripts, HeadOutlet, SsrDataOutlet } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

export default function Root(props: { children?: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <HeadOutlet />
            </head>
            <body>
                {props.children}
                <SsrDataOutlet />
                <ClientScripts />
            </body>
        </html>
    );
}
