import { useQuery } from '@tanstack/react-query';

import { FetchError } from '@/constants/error.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function useCheckFireflyAccount(withSyncing = true, forceQuery = false) {
    const isSyncing = useAsyncStatusAll();
    const { preferences, rehydrating, setPreference } = usePreferencesState();
    const { currentProfileSession } = useFireflyProfileStore();

    const accountId = currentProfileSession?.profileId;
    const hasChecked = preferences.FIREFLY_ACCOUNT_CHECKED_MAP[accountId || ''] ?? false;

    const { data, isLoading } = useQuery({
        queryKey: ['check-firefly-account', accountId],
        queryFn: async () => {
            if (hasChecked) return { hasFireflyAccount: true };
            if (!accountId) return { hasFireflyAccount: false };

            const connections = await fireflyEndpointProvider.getAllConnections();
            const fireflyAccount = formatFireflyAccountProfileFromFireflyConnections(connections.account, false);
            const hasFireflyAccount = !!fireflyAccount?.displayName || !!fireflyAccount?.avatar;
            if (hasFireflyAccount) {
                setPreference('FIREFLY_ACCOUNT_CHECKED_MAP', (prev) => ({
                    ...prev,
                    [accountId]: true,
                }));
            }

            return {
                hasFireflyAccount,
                displayName: fireflyAccount?.displayName,
                avatar: fireflyAccount?.avatar,
            };
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
        retry: (failureCount, error) => {
            // do not retry on unauthorized errors
            if (error instanceof FetchError && error.status === 401) return false;
            return failureCount < 2;
        },
        enabled: !!accountId && (!hasChecked || forceQuery),
    });

    return {
        hasFireflyAccount: hasChecked && !forceQuery ? true : (data?.hasFireflyAccount ?? false),
        isLoading: hasChecked && !forceQuery ? false : isLoading || (withSyncing && isSyncing) || rehydrating,
        displayName: data?.displayName,
        avatar: data?.avatar,
    };
}
