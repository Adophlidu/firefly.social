import { IS_PRODUCTION } from '@dimensiondev/constants';
import { envs } from '@dimensiondev/envs/wallet';
import { configureExceptionTracker } from '@dimensiondev/exception-tracker';
import { bom } from '@dimensiondev/utils';

import { evmWalletAddressAtom, solanaWalletAddressAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

/**
 * Configures the exception tracker for client and server reporting.
 * Must be called once at app startup (client-side).
 */
export function initExceptionTracker(): void {
    configureExceptionTracker({
        enabled: IS_PRODUCTION,
        ignoredErrors: ['[iframe-bridge]', 'Window load timeout', 'insufficient funds'],
        getClient: () => ({
            version: envs.shared.VERSION,
            commitHash: envs.shared.COMMIT_HASH ?? '',
            environment: IS_PRODUCTION ? 'production' : 'development',
            vercelEnvironment: envs.external.NEXT_PUBLIC_VERCEL_ENV,
            beaconUrl: '/api/beacon/exceptions',
            serviceName: 'firefly-wallet',
            getBom: () => ({
                navigator: bom.navigator ?? null,
                location: bom.location ?? null,
                window: bom.window as (Window & Record<string, unknown>) | null,
            }),
            getUrls: () => ({
                rootUrl: envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
                siteUrl: envs.external.NEXT_PUBLIC_SITE_URL,
            }),
        }),
        getServer: () => ({
            baseUrl: '/',
            version: envs.shared.VERSION,
            commitHash: envs.shared.COMMIT_HASH ?? '',
            environment: IS_PRODUCTION ? 'production' : 'development',
            vercelEnvironment: envs.external.NEXT_PUBLIC_VERCEL_ENV,
            serviceName: 'firefly-wallet',
        }),
        getUserContext: () => {
            return {
                evm_wallet_address: store.get(evmWalletAddressAtom) ?? undefined,
                solana_wallet_address: store.get(solanaWalletAddressAtom) ?? undefined,
            };
        },
    });
}
