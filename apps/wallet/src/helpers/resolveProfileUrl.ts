import { Source } from '@dimensiondev/enums';
import { NetworkType } from '@dimensiondev/web3/enums';
import { getAddressType } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import {
    LOGIN_SORTED_PROFILE_TAB_TYPE,
    SORTED_PROFILE_TAB_TYPE,
    WALLET_PROFILE_TAB_TYPES,
} from '@/constants/computed.js';
import type { ProfileCategory, ProfilePageSource } from '@/constants/enum.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { resolveProfileSourceInURL } from '@/helpers/resolveSourceInUrl.js';

function getDefaultProfileCategory(source: ProfilePageSource, handle?: string, isCurrentProfile = false) {
    if (source === Source.Wallet || source === Source.WalletMix) {
        return getAddressType(handle || '', false) === NetworkType.Solana
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
            ? getAddressType(handle || '', false) === NetworkType.Solana
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
    if (!handle) {
        return urlcat(`/profile/:source`, {
            source: s,
        });
    }
    if (!category) {
        return urlcat(`/profile/:source/:handle`, {
            handle,
            source: s,
        });
    }
    return urlcat(`/profile/:source/:handle/:category`, {
        handle,
        source: s,
        category: resolveProfileCategory(source, handle, category, isCurrentProfile),
    });
}
