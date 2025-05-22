import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { getSocialConnectionsWithProfile } from '@/services/getSocialConnectionsWithProfile.js';

export function useAllConnectionsFormattedWithProfiles(options?: { enabled?: boolean }) {
    const profileAll = useProfileStoreAll();
    const queryKeyProfileIds = Object.entries(profileAll).flatMap(([, profile]) =>
        profile.accounts.map((x) => x.profile.profileId),
    );
    return useQuery({
        queryKey: ['my-wallet-connections', 'with-profile', queryKeyProfileIds],
        async queryFn() {
            const connections = await FireflyEndpointProvider.getAllConnectionsFormatted();
            const settles = await Promise.allSettled(
                SORTED_SOCIAL_SOURCES.map(async (source) => {
                    const accounts = profileAll[source]?.accounts ?? [];
                    const connectionsWithProfile = await getSocialConnectionsWithProfile(source, connections.social);
                    return {
                        source,
                        items: connectionsWithProfile.map((x) => ({
                            ...x,
                            account: accounts.find((account) => isSameProfile(x.profile, account.profile)),
                        })),
                    };
                }),
            );
            return {
                ...connections,
                socialConnections: compact(
                    settles.map((result) => (result.status === 'fulfilled' ? result.value : null)),
                ),
            };
        },
        enabled: options?.enabled,
    });
}
