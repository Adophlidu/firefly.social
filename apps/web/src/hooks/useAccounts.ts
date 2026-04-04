import { useMemo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import { type Account } from '@/providers/types/Account.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export function useAccounts(source: SocialSource) {
    const all = useAccountsAll();
    return all[source];
}

function useAccountsAll() {
    const lensAccounts = useLensProfileStore.use.accounts();
    const farcasterAccounts = useFarcasterProfileStore.use.accounts();
    const twitterAccounts = useTwitterProfileStore.use.accounts();
    const bskyAccounts = useBskyProfileStore.use.accounts();

    return useMemo<Record<SocialSource, Account[]>>(
        () => ({
            [Source.Farcaster]: farcasterAccounts,
            [Source.Lens]: lensAccounts,
            [Source.Twitter]: twitterAccounts,
            [Source.Bsky]: bskyAccounts,
        }),
        [lensAccounts, farcasterAccounts, twitterAccounts, bskyAccounts],
    );
}
