import { useQueries } from '@tanstack/react-query';
import { compact, first } from 'lodash-es';

import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import {
    getProfileIdsFromSocialConnections,
    getSocialConnectionsWithProfile,
} from '@/services/getSocialConnectionsWithProfile.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

export function useAllConnectionsFormattedWithProfiles(options?: { enabled?: boolean }) {
    const { accounts } = useThirdPartyStateStore();
    const { data: connections, refetch } = useAllConnections({ enabled: options?.enabled });
    const query = useQueries({
        queries: compact(
            SORTED_SOCIAL_SOURCES.map((source) => {
                if (!connections?.social) return;
                const ids = getProfileIdsFromSocialConnections(source, connections?.social);
                return {
                    queryKey: ['profiles', source, ids],
                    async queryFn() {
                        return {
                            connectionsWithProfile: await getSocialConnectionsWithProfile(source, connections.social),
                            source,
                        };
                    },
                    enabled: options?.enabled && !!connections?.social?.[source],
                };
            }),
        ),
        combine(result) {
            const isLoading = result.some((x) => x.isLoading);
            const error = first(compact(result.map((x) => x.error)));
            const data = {
                ...connections,
                socialConnections: compact(
                    result.map((query) => {
                        if (!query.data) return null;
                        return {
                            source: query.data.source,
                            items: query.data.connectionsWithProfile.map((x) => ({
                                ...x,
                                account: accounts.find((account) => isSameProfile(x.profile, account.profile)),
                            })),
                        };
                    }),
                ),
            };
            return {
                isLoading,
                error,
                data,
            };
        },
    });
    return {
        ...query,
        refetch,
    };
}
