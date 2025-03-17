'use client';

import { useAsync } from 'react-use';

import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function FireflySessionAbsencePatch() {
    const asyncStatusAll = useAsyncStatusAll();
    const profileStoreAll = useProfileStoreAll();
    const { currentProfile } = useFireflyStateStore();

    useAsync(async () => {
        if (asyncStatusAll || currentProfile) return;

        // force login again if no firefly session was found
        SORTED_SOCIAL_SOURCES.forEach((x) => profileStoreAll[x].clear());

        console.warn('[patch] firefly session absence detected. Clearing all profiles.');
    }, [asyncStatusAll, currentProfile, profileStoreAll]);

    return null;
}
