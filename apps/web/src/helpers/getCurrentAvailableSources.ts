import { EMPTY_LIST } from '@dimensiondev/constants';
import { SORTED_SOCIAL_SOURCES } from '@dimensiondev/constants/computed';

import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';

export function getCurrentAvailableSources() {
    if (typeof window === 'undefined') return EMPTY_LIST;
    const currentProfileAll = getCurrentProfileAllFromStorage();
    return SORTED_SOCIAL_SOURCES.filter((source) => !!currentProfileAll[source]?.profileId);
}
