import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';

export function getCurrentAvailableSources() {
    const currentProfileAll = getCurrentProfileAllFromStorage();
    return SORTED_SOCIAL_SOURCES.filter((source) => !!currentProfileAll[source]?.profileId);
}
