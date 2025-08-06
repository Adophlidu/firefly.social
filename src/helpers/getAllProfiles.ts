import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export function getAllProfiles() {
    const allAccounts = getAllAccounts();
    return allAccounts.map((x) => x.profile);
}

export function getAllAccounts() {
    const { accounts: lensAccounts } = useLensProfileStore.getState();
    const { accounts: farcasterAccounts } = useFarcasterProfileStore.getState();
    const { accounts: twitterAccounts } = useTwitterProfileStore.getState();
    const { accounts: bskyAccounts } = useBskyProfileStore.getState();

    return [...lensAccounts, ...farcasterAccounts, ...twitterAccounts, ...bskyAccounts];
}
