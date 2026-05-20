import { IS_PRODUCTION } from '@dimensiondev/constants';
import { env } from '@dimensiondev/envs/wallet';
import { configureExceptionTracker } from '@dimensiondev/exception-tracker';
import { bom } from '@dimensiondev/utils';

/**
 * Configures the exception tracker for client and server reporting.
 * Must be called once at app startup (client-side).
 */
export function initExceptionTracker(): void {
    configureExceptionTracker({
        enabled: IS_PRODUCTION,
        ignoredErrors: ['[iframe-bridge]', 'Window load timeout', 'insufficient funds'],
        getClient: () => ({
            version: env.shared.VERSION,
            commitHash: env.shared.COMMIT_HASH ?? '',
            environment: IS_PRODUCTION ? 'production' : 'development',
            vercelEnvironment: env.external.NEXT_PUBLIC_VERCEL_ENV,
            beaconUrl: '/api/beacon/exceptions',
            serviceName: 'firefly-wallet',
            getBom: () => ({
                navigator: bom.navigator ?? null,
                location: bom.location ?? null,
                window: bom.window as (Window & Record<string, unknown>) | null,
            }),
            getUrls: () => ({
                rootUrl: env.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
                siteUrl: env.external.NEXT_PUBLIC_SITE_URL,
            }),
        }),
        getServer: () => ({
            baseUrl: '/',
            version: env.shared.VERSION,
            commitHash: env.shared.COMMIT_HASH ?? '',
            environment: IS_PRODUCTION ? 'production' : 'development',
            vercelEnvironment: env.external.NEXT_PUBLIC_VERCEL_ENV,
            serviceName: 'firefly-wallet',
        }),
    });
}
