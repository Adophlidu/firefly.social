import { first, sortBy } from 'lodash-es';
import { useMemo } from 'react';

import { EMBED_CARD_SOURCE_PRIORITY, EMPTY_LIST } from '@/constants/index.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';

/**
 * by priority: {@link EMBED_CARD_SOURCE_PRIORITY}
 */
export function useWalletIdentity(address: string) {
    const { data: profiles = EMPTY_LIST } = useWalletRelatedProfiles(address);
    const displayName = useMemo(() => {
        const sorted = sortBy(profiles, (x) => {
            const index = EMBED_CARD_SOURCE_PRIORITY.indexOf(x.identity.source);
            return index === -1 ? Number.MAX_SAFE_INTEGER : index;
        });
        return first(sorted)?.displayName;
    }, [profiles]);

    return displayName;
}
