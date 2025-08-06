import { compact } from 'lodash-es';

import type { SocialSource } from '@/constants/enum.js';
import { getProfileAllFromStorage } from '@/helpers/getProfileFromStorage.js';

export function getCurrentAvailableSources() {
    const currentProfileAll = getProfileAllFromStorage();
    return compact(
        Object.entries(currentProfileAll).map(([source, profile]) => (profile ? (source as SocialSource) : undefined)),
    );
}
