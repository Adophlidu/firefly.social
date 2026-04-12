import { SORTED_PROFILE_TAB_TYPE } from '@/constants/computed.js';
import type { SocialProfileCategory, SocialSource } from '@/constants/enum.js';

export function isSocialProfileCategory(source: SocialSource, category: string): category is SocialProfileCategory {
    return SORTED_PROFILE_TAB_TYPE[source].includes(category as SocialProfileCategory);
}
