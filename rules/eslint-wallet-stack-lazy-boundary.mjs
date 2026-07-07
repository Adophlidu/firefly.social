/**
 * The heavy wallet stack (configs/wagmiClient.ts: 26 viem chains + AppKit
 * wagmi adapter + Privy connector; configs/appkit.ts: createAppKit + solana
 * adapter) must stay lazy on every page. All on-demand access goes through
 * the 'use client' funnel `configs/wagmiClientLoader.ts`.
 *
 * Why a raw `import('@/configs/wagmiClient.js')` elsewhere is a bundle bug,
 * not a style nit: modules without 'use client' that are reachable from
 * server components compile in Turbopack's RSC layer, and a dynamic import
 * of a 'use client' module from an RSC-layer module registers it as a
 * client-reference entry in every page's client-reference manifest.
 * Turbopack merges all client-reference entries of a page into one shared
 * chunk group, so the entry's whole static graph is emitted as eager
 * <script> tags in the SSR HTML — this silently re-inflated every page by
 * ~540KB gz until fixed. Funneling the only import() edge through the
 * client-layer loader keeps the stack lazy no matter who calls it.
 */

const WAGMI_CLIENT_MESSAGE =
    "Import the wallet stack via loadWagmiClient() from '@/configs/wagmiClientLoader.js' instead of a raw " +
    "import('@/configs/wagmiClient.js'). A raw dynamic import from a module that is reachable from server " +
    "components registers the whole wallet stack as a client reference in every page's manifest, and Turbopack " +
    'merges it into the shared eager chunk group (see rules/eslint-wallet-stack-lazy-boundary.mjs).';

const APPKIT_MESSAGE =
    "Do not dynamically import '@/configs/appkit.js' directly — it drags configs/wagmiClient.ts with it and has " +
    'the same Turbopack RSC-layer eager-bundling hazard. AppKit initializes via the static side-effect import in ' +
    'modals/WalletModals.tsx once the wallet stack activates (see rules/eslint-wallet-stack-lazy-boundary.mjs).';

/** @type {import('eslint').Linter.Config[]} */
export const walletStackLazyBoundaryConfigs = [
    {
        files: ['apps/web/src/**/*.{ts,tsx}'],
        // The funnel itself holds the single allowed import() edge.
        ignores: ['apps/web/src/configs/wagmiClientLoader.ts'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: "ImportExpression > Literal[value='@/configs/wagmiClient.js']",
                    message: WAGMI_CLIENT_MESSAGE,
                },
                {
                    selector: "ImportExpression > Literal[value='@/configs/appkit.js']",
                    message: APPKIT_MESSAGE,
                },
            ],
        },
    },
];
