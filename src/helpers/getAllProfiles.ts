import {
    useBskyStateStore,
    useFarcasterStateStore,
    useLensStateStore,
    useTwitterStateStore,
} from '@/store/useProfileStore.js';

export function getAllProfiles() {
    const allAccounts = getAllAccounts();
    return allAccounts.map((x) => x.profile);
}

export function getAllAccounts() {
    const { accounts: lensAccounts } = useLensStateStore.getState();
    const { accounts: farcasterAccounts } = useFarcasterStateStore.getState();
    const { accounts: twitterAccounts } = useTwitterStateStore.getState();
    const { accounts: bskyAccounts } = useBskyStateStore.getState();

    return [...lensAccounts, ...farcasterAccounts, ...twitterAccounts, ...bskyAccounts];
}
