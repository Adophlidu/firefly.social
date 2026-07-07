'use client';

import type * as WagmiClientModule from '@/configs/wagmiClient.js';

/**
 * The single async edge into the heavy wallet stack
 * (`configs/wagmiClient.ts`: 26 viem chains + AppKit wagmi adapter + Privy
 * connector).
 *
 * Every on-demand consumer MUST go through `loadWagmiClient()` instead of
 * calling `import('@/configs/wagmiClient.js')` directly. The `'use client'`
 * directive here is load-bearing for the bundle: several consumers (e.g. the
 * lens providers behind `resolveSocialMediaProvider`) are also reachable from
 * server components, and a dynamic import of a `'use client'` module from an
 * RSC-layer module registers the whole wallet stack as a client reference in
 * the page's client-reference manifest — Turbopack then merges those chunks
 * into the page's shared eager chunk group, putting AppKit and the adapters
 * back into every page's SSR script tags. Funneling the import through this
 * client-layer module keeps that edge (and the stack) lazy everywhere.
 */
export function loadWagmiClient(): Promise<typeof WagmiClientModule> {
    return import('@/configs/wagmiClient.js');
}
