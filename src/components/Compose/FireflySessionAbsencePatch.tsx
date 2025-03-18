'use client';

import { useEffect } from 'react';

import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { useAsyncStatusStoreAll } from '@/hooks/useAsyncStatus.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function FireflySessionAbsencePatch() {
    const asyncStatusAll = useAsyncStatusStoreAll();
    const profileStoreAll = useProfileStoreAll();
    const { currentProfile } = useFireflyStateStore();

    useEffect(() => {
        // store is not ready yet
        if (asyncStatusAll) return;

        // force login again if no firefly session was found
        if (!currentProfile) {
            SORTED_SOCIAL_SOURCES.forEach((x) => {
                profileStoreAll[x].clear();
                resolveSessionHolder(x).removeSession();
            });
        }

        console.warn('[patch-6.9.2] firefly session absence detected. Clearing all profiles.');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [asyncStatusAll]);

    return null;
}
