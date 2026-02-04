import { bom } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_EXCEPTION_TRACKER_URL, IS_PRODUCTION } from '@/constants/static.js';
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

    // environment
    environment?: string;
    vercel_environment?: string;

    // build information
    release_version?: string;
    commit_hash?: string;

    // urls
    root_url?: string;
    site_url?: string;
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
 * Payload is encoded into the URL search parameters (no request body).
 */
export function reportException(payload: ReportExceptionPayload): boolean {
    const apiKey = env.external.NEXT_PUBLIC_FIREFLY_EXCEPTION_TRACKER_API_KEY;
    if (!apiKey) {
        throw new Error('reportException: NEXT_PUBLIC_FIREFLY_EXCEPTION_TRACKER_API_KEY is not set');
    }

    const { tags, ...rest } = payload;
    const url = urlcat(FIREFLY_EXCEPTION_TRACKER_URL, '/api/exceptions', {
        api_key: apiKey,

        ...rest,

        // service name
        service_name: 'firefly-web',

        // environment
        environment: IS_PRODUCTION ? 'production' : 'development',
        vercel_environment: env.external.NEXT_PUBLIC_VERCEL_ENV,

        // build information
        release_version: process.version,
        commit_hash: env.shared.COMMIT_HASH,

        // urls
        root_url: settings.FIREFLY_ROOT_URL,
        site_url: env.external.NEXT_PUBLIC_SITE_URL,
        request_url: bom.location?.href,

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
    });
    return bom.navigator?.sendBeacon?.(url) ?? false;
}
