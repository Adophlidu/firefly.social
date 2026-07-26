import type { ReactElement } from 'react';

import { RouterContext } from './context.ts';

/**
 * The client-side assets the server-rendered document should load. In dev
 * this is the raw entry module; in production it comes from the Vite build
 * manifest (hashed files, extracted CSS).
 */
export interface ClientAssets {
    /** JS entry URLs, rendered as `<script type="module">`. */
    scripts: string[];
    /** CSS URLs, rendered as `<link rel="stylesheet">`. */
    styles: string[];
    /**
     * Per-route-file assets (keyed by route file path, e.g.
     * `_layout.tsx` or `post/$source/$id/index.tsx`): the JS chunk and its
     * extracted CSS. The server merges the matched chain's CSS into
     * `styles` for the initial document — route CSS must arrive with the
     * HTML, not via the client bundle's late injection (FOUC).
     */
    routes?: Record<string, { scripts?: string[]; styles?: string[] }>;
}

/**
 * Renders the client bundle script tags. Place once near the end of the
 * root component's `<body>`.
 */
export function ClientScripts(): ReactElement {
    return (
        <RouterContext.Consumer>
            {(state) => (
                <>
                    {(state?.clientAssets?.scripts ?? []).map((src) => (
                        <script key={src} type="module" src={src} />
                    ))}
                </>
            )}
        </RouterContext.Consumer>
    );
}

/**
 * Renders the client bundle stylesheet links. Place once inside the root
 * component's `<head>`.
 */
export function ClientStyles(): ReactElement {
    return (
        <RouterContext.Consumer>
            {(state) => (
                <>
                    {(state?.clientAssets?.styles ?? []).map((href) => (
                        <link key={href} rel="stylesheet" href={href} />
                    ))}
                </>
            )}
        </RouterContext.Consumer>
    );
}
