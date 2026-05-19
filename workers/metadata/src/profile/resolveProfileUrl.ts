import type { ProfileCategory, ProfilePageSource } from '@dimensiondev/enums';
import { NetworkType, Source } from '@dimensiondev/enums';
import { resolveProfileSourceInURL } from '@dimensiondev/workers-shared/helpers/resolveSource.js';

import {
    LOGIN_SORTED_PROFILE_TAB_TYPE,
    SORTED_PROFILE_TAB_TYPE,
    WALLET_PROFILE_TAB_TYPES,
} from '@/metadata/src/profile/constants.js';
import { getAddressType } from '@/metadata/src/profile/getAddressType.js';
import { isFollowCategory } from '@/metadata/src/profile/isFollowCategory.js';

function getDefaultProfileCategory(source: ProfilePageSource, handle?: string, isCurrentProfile = false) {
    if (source === Source.Wallet || source === Source.WalletMix) {
        return getAddressType(handle || '') === NetworkType.Solana
            ? WALLET_PROFILE_TAB_TYPES.solana[0]
            : WALLET_PROFILE_TAB_TYPES.ethereum[0];
    }
    return (isCurrentProfile ? LOGIN_SORTED_PROFILE_TAB_TYPE : SORTED_PROFILE_TAB_TYPE)[source][0];
}

function resolveProfileCategory(
    source: ProfilePageSource,
    handle?: string,
    category?: ProfileCategory,
    isCurrentProfile = false,
) {
    if (!category) return getDefaultProfileCategory(source, handle);
    if (isFollowCategory(category)) return category;

    const supportedCategories: string[] =
        source === Source.Wallet || source === Source.WalletMix
            ? getAddressType(handle || '') === NetworkType.Solana
                ? WALLET_PROFILE_TAB_TYPES.solana
                : WALLET_PROFILE_TAB_TYPES.ethereum
            : (isCurrentProfile ? LOGIN_SORTED_PROFILE_TAB_TYPE : SORTED_PROFILE_TAB_TYPE)[source];
    return supportedCategories.includes(category) ? category : getDefaultProfileCategory(source, handle);
}
/**
 * ! Please don't use this function directly, use `getProfileUrl` instead.
 */
export function resolveProfileUrl(
    source: ProfilePageSource,
    handle?: string,
    category?: ProfileCategory,
    isCurrentProfile = false,
) {
    const s = resolveProfileSourceInURL(source);
    if (!handle) return `/profile/${s}`;
    if (!category) return `/profile/${s}/${handle}`;
    return `/profile/${s}/${handle}/${resolveProfileCategory(source, handle, category, isCurrentProfile)}`;
}
