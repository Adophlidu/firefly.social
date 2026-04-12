import { getExceptionTrackerConfig } from '@/config.js';
import type { ExceptionPayload, ExceptionTags } from '@/types.js';

/**
 * Sends an exception report to the remote exception tracker via sendBeacon.
 * Uses sendBeacon so the request is queued and sent even when the page is unloading.
 * The request is proxied through /api/beacon/exceptions which forwards it to the actual tracker.
 * Returns true if the beacon was queued.
 *
 * Must call configureExceptionTracker() with client config before using.
 */
export function reportException(payload: ExceptionPayload): boolean {
    const cfg = getExceptionTrackerConfig()?.getClient?.();
    if (!cfg) {
        console.warn('[reportException] Client config not configured');
        return false;
    }

    const { tags, ...rest } = payload;
    const bom = cfg.getBom();
    const urls = cfg.getUrls();

    const body = {
        ...rest,

        // service name
        service_name: cfg.serviceName ?? 'firefly-web',

        // version
        release_version: cfg.version ?? '',
        commit_hash: cfg.commitHash ?? '',

        // environment
        vercel_environment: cfg.vercelEnvironment,
        environment: cfg.environment,

        // user agent
        os: bom.navigator?.platform,
        browser: bom.navigator?.userAgent,
        user_agent: bom.navigator?.userAgent,

        // urls
        request_url: bom.location?.href,
        root_url: urls.rootUrl,
        site_url: urls.siteUrl,
        frame_server_url: urls.frameServerUrl,

        // vercel region
        ip_timezone: (bom.window as Record<string, unknown>)?.VERCEL_IP_TIMEZONE,
        ip_city: (bom.window as Record<string, unknown>)?.VERCEL_IP_CITY,
        ip_country: (bom.window as Record<string, unknown>)?.VERCEL_IP_COUNTRY,
        ip_region: (bom.window as Record<string, unknown>)?.VERCEL_IP_REGION,

        // tags
        ...(tags && {
            tags: Object.fromEntries(Object.entries(tags as ExceptionTags).map(([k, v]) => [k, String(v)])),
        }),
    };

    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    return bom.navigator?.sendBeacon?.(cfg.beaconUrl, blob) ?? false;
}
