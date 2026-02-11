import { bom } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { IS_PRODUCTION } from '@/constants/static.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export interface ReportExceptionPayload {
    message: string;
    exception_type?: string;
    service_name?: string;
    stack_trace?: string;
    timestamp?: string;
    severity?: 'error' | 'warning' | 'critical';
    ip_address?: string;

    // version
    release_version?: string;

    // environment
    environment?: string;
    vercel_environment?: string;

    // user agent
    os?: string;
    browser?: string;
    user_agent?: string;
    commit_hash?: string;

    // urls
    root_url?: string;
    site_url?: string;
    frame_server_url?: string;
    request_url?: string;

    // vercel region
    ip_timezone?: string;
    ip_city?: string;
    ip_country?: string;
    ip_region?: string;

    // social login parameters
    user_id?: string;
    twitter_username?: string;
    lens_handle?: string;
    farcaster_id?: string;
    bsky_id?: string;

    // tags
    tags?: Record<string, string | number | boolean>;
}

/**
 * Sends an exception report to the remote exception tracker via sendBeacon.
 * Uses sendBeacon so the request is queued and sent even when the page is unloading.
 * The request is proxied through /api/beacon/exceptions which forwards it to the actual tracker.
 * Returns true if the beacon was queued.
 */
export function reportException(payload: ReportExceptionPayload): boolean {
    const { tags, ...rest } = payload;
    const body = {
        ...rest,

        // service name
        service_name: 'firefly-web',

        // version
        release_version: env.shared.VERSION,

        // environment
        vercel_environment: env.external.NEXT_PUBLIC_VERCEL_ENV,
        environment: IS_PRODUCTION ? 'production' : 'development',

        // user agent
        os: bom.navigator?.platform,
        browser: bom.navigator?.userAgent,
        user_agent: bom.navigator?.userAgent,
        commit_hash: env.shared.COMMIT_HASH,

        // urls
        root_url: settings.FIREFLY_ROOT_URL,
        site_url: env.external.NEXT_PUBLIC_SITE_URL,
        request_url: bom.location?.href,
        frame_server_url: settings.FRAME_SERVER_URL,

        // vercel region
        ip_timezone: bom.window?.VERCEL_IP_TIMEZONE,
        ip_city: bom.window?.VERCEL_IP_CITY,
        ip_country: bom.window?.VERCEL_IP_COUNTRY,
        ip_region: bom.window?.VERCEL_IP_REGION,

        // social login parameters
        user_id: getSessionFromStorage(SessionType.Firefly)?.profileId,
        twitter_username: getCurrentProfileFromStorage(Source.Twitter)?.handle,
        lens_handle: getCurrentProfileFromStorage(Source.Lens)?.handle,
        farcaster_id: getCurrentProfileFromStorage(Source.Farcaster)?.profileId,
        bsky_id: getCurrentProfileFromStorage(Source.Bsky)?.profileId,

        // tags
        ...(tags && {
            tags: Object.fromEntries(Object.entries(tags).map(([k, v]) => [k, String(v)])),
        }),
    };

    // Use the beacon API proxy endpoint which forwards to the actual tracker
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    return bom.navigator?.sendBeacon?.('/api/beacon/exceptions', blob) ?? false;
}
