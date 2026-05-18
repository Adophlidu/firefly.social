import type { SocialProfileCategory, SocialSource } from '@dimensiondev/enums';

import { SORTED_PROFILE_TAB_TYPE } from '@/constants/computed.js';

export function isSocialProfileCategory(source: SocialSource, category: string): category is SocialProfileCategory {
    return SORTED_PROFILE_TAB_TYPE[source].includes(category as SocialProfileCategory);
}
