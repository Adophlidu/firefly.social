import { SORTED_SOCIAL_SOURCES } from '@dimensiondev/constants/computed';
import type { NotificationSourceType } from '@dimensiondev/enums';
import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { getIsActivated } from '@/services/listenNotifications.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function useNewestNotification() {
    const currentProfiles = useCurrentProfilesAll();
    const { preferences } = usePreferencesState();
    const { currentProfileSession } = useFireflyProfileStore();

    return useMemo(() => {
        const allRecords = Object.entries(preferences.NOTIFICATION_READ_RECORD || {}).flatMap(([type, records]) => {
            return records.map((x) => ({ ...x, type: type as NotificationSourceType }));
        });
        if (!currentProfileSession?.profileId || !allRecords.length || !getIsActivated()) return null;

        const allProfileIds = compact([
            currentProfileSession.profileId,
            ...SORTED_SOCIAL_SOURCES.map((x) => currentProfiles[x]?.profileId),
        ]);
        return allRecords.find((record) =>
            allProfileIds.some((profileId) => record.profileId === profileId && record.hasNewNotification),
        );
    }, [currentProfileSession?.profileId, preferences, currentProfiles]);
}
