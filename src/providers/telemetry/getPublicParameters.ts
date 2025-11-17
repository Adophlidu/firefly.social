import { bom } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { useDeveloperSettingsState } from '@/store/useDeveloperSettingsStore.js';

export function getPublicParameters(eventId: string, previousEventId: string | null) {
    const fireflySession = getSessionFromStorage(SessionType.Firefly);

    const lensProfile = getProfileFromStorage(Source.Lens);
    const farcasterProfile = getProfileFromStorage(Source.Farcaster);
    const xProfile = getProfileFromStorage(Source.Twitter);
    const bskyProfile = getProfileFromStorage(Source.Bsky);

    const developmentAPI = useDeveloperSettingsState.getState().developmentAPI;

    return {
        // ga best practices
        user_id: fireflySession?.profileId, // numeric user id

        public_uuid: eventId,
        public_previous_uuid: previousEventId,

        public_ua: bom.navigator?.userAgent,
        public_href: bom.location?.href,

        // firefly session
        public_account_id: fireflySession?.accountIdForEvent,
        public_use_development_api: developmentAPI,

        // vercel region
        public_ip_timezone: bom.window?.VERCEL_IP_TIMEZONE,
        public_ip_city: bom.window?.VERCEL_IP_CITY,
        public_ip_country: bom.window?.VERCEL_IP_COUNTRY,
        public_ip_region: bom.window?.VERCEL_IP_REGION,

        // firefly account id
        firefly_account_id: fireflySession?.accountIdForEvent,

        // social login parameters
        twitter_username: xProfile?.handle,
        lens_handle: lensProfile?.handle,
        farcaster_id: farcasterProfile?.profileId,
        bsky_id: bskyProfile?.profileId,

        activity:
            bom.location?.pathname?.startsWith('/events') || bom.location?.pathname?.startsWith('/event/')
                ? bom.location.href
                : undefined,
    };
}
