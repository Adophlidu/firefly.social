import { first, sortBy } from 'lodash-es';
import { useMemo } from 'react';

import { Source } from '@/constants/enum.js';
import { EMBED_CARD_SOURCE_PRIORITY, EMPTY_LIST } from '@/constants/index.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

/**
 * by priority: {@link EMBED_CARD_SOURCE_PRIORITY}
 */
export function useWalletDisplayName(address: string) {
    const { data: profiles = EMPTY_LIST } = useWalletRelatedProfiles(address);
    const displayName = useMemo(() => {
        const sorted = sortBy(profiles, (x) => {
            const index = EMBED_CARD_SOURCE_PRIORITY.indexOf(x.identity.source);
            return index === -1 ? Number.MAX_SAFE_INTEGER : index;
        });
        const profile = first(sorted);
        if (!profile) return null;
        if (profile.identity.source === Source.Wallet) {
            /** formatted address is set as fallback in formatFireflyProfilesFromWalletProfiles */
            const walletProfile = profile.__origin__ as WalletProfile;
            return walletProfile.primary_ens;
        }
        return profile.displayName;
    }, [profiles]);

    return displayName;
}
