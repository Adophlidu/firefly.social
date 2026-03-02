import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';

export function getCurrentAvailableSources() {
    if (typeof window === 'undefined') return EMPTY_LIST;
    const currentProfileAll = getCurrentProfileAllFromStorage();
    return SORTED_SOCIAL_SOURCES.filter((source) => !!currentProfileAll[source]?.profileId);
}
