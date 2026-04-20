import { IS_PRODUCTION } from '@dimensiondev/constants';
import { envs } from '@dimensiondev/envs';
import { configureExceptionTracker } from '@dimensiondev/exception-tracker';
import { bom } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import { EXCEPTION_TRACKER_URL } from '@/constants/static.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

/**
 * Configures the exception tracker with app-specific settings.
 * Call this once at app startup (client and server).
 */
export function configureErrorCapture(): void {
    configureExceptionTracker({
        enabled: IS_PRODUCTION,
        getClient: () => ({
            version: envs.shared.VERSION,
            commitHash: envs.shared.COMMIT_HASH,
            environment: IS_PRODUCTION ? 'production' : 'development',
            vercelEnvironment: envs.external.NEXT_PUBLIC_VERCEL_ENV,
            beaconUrl: '/api/beacon/exceptions',
            serviceName: 'firefly-web',
            getBom: () => ({
                navigator: bom.navigator,
                location: bom.location,
                window: bom.window as Window & Record<string, unknown>,
            }),
            getUrls: () => ({
                rootUrl: settings.FIREFLY_ROOT_URL,
                siteUrl: envs.external.NEXT_PUBLIC_SITE_URL,
                frameServerUrl: settings.FRAME_SERVER_URL,
            }),
        }),
        getServer: () => ({
            baseUrl: EXCEPTION_TRACKER_URL,
            version: envs.shared.VERSION,
            commitHash: envs.shared.COMMIT_HASH,
            environment: IS_PRODUCTION ? 'production' : 'development',
            vercelEnvironment: envs.external.NEXT_PUBLIC_VERCEL_ENV,
            serviceName: 'firefly-server',
        }),
        getUserContext: () => {
            const fireflySession = getSessionFromStorage(SessionType.Firefly);
            const twitterProfile = getCurrentProfileFromStorage(Source.Twitter);
            const lensProfile = getCurrentProfileFromStorage(Source.Lens);
            const farcasterProfile = getCurrentProfileFromStorage(Source.Farcaster);
            const bskyProfile = getCurrentProfileFromStorage(Source.Bsky);

            return {
                user_id: fireflySession?.profileId,
                twitter_username: twitterProfile?.handle,
                lens_handle: lensProfile?.handle,
                farcaster_id: farcasterProfile?.profileId,
                bsky_id: bskyProfile?.profileId,
            };
        },
    });
}
