import { compact } from 'lodash-es';

import type { SocialSource } from '@/constants/enum.js';
import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';

export function getCurrentAvailableSources() {
    const currentProfileAll = getCurrentProfileAllFromStorage();
    return compact(
        Object.entries(currentProfileAll).map(([source, profile]) => (profile ? (source as SocialSource) : undefined)),
    );
}
