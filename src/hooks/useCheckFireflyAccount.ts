import { useQuery } from '@tanstack/react-query';

import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function useCheckFireflyAccount() {
    const isSyncing = useAsyncStatusAll();
    const { preferences, rehydrating, setPreference } = usePreferencesState();
    const { currentProfileSession } = useFireflyStateStore();

    const accountId = currentProfileSession?.profileId;
    const hasChecked = preferences.FIREFLY_ACCOUNT_CHECKED_MAP[accountId || ''] ?? false;

    const { data, isLoading } = useQuery({
        queryKey: ['check-firefly-account', accountId],
        queryFn: async () => {
            if (hasChecked) return { hasFireflyAccount: true };
            if (!accountId) return { hasFireflyAccount: false };

            const connections = await FireflyEndpointProvider.getAllConnections();
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
        enabled: !!accountId && !hasChecked,
    });

    return {
        hasFireflyAccount: hasChecked ? true : (data?.hasFireflyAccount ?? false),
        isLoading: hasChecked ? false : isLoading || isSyncing || rehydrating,
        displayName: data?.displayName,
        avatar: data?.avatar,
    };
}
