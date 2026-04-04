import { useMemo } from 'react';

import { SORTED_NOTIFICATIONS_SOURCES, X_WEBHOOK_WHITELIST_CLIENT_IDS } from '@/constants/computed.js';
import { Source } from '@/constants/enum.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export function useNotificationSources() {
    const currentTwitterProfile = useTwitterProfileStore.use.currentProfile();
    const profileId = currentTwitterProfile?.profileId;

    return useMemo(
        () =>
            !!profileId && X_WEBHOOK_WHITELIST_CLIENT_IDS.includes(profileId)
                ? SORTED_NOTIFICATIONS_SOURCES
                : SORTED_NOTIFICATIONS_SOURCES.filter((source) => source !== Source.Twitter),
        [profileId],
    );
}
