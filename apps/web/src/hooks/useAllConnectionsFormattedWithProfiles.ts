import { unreachable } from '@dimensiondev/utils';
import { useQueries } from '@tanstack/react-query';
import { compact, first } from 'lodash-es';

import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { Source } from '@/constants/enum.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import type { LensConnection } from '@/providers/types/Firefly.js';
import {
    getConnections,
    getProfileFromSocialConnections,
    getProfileIdsFromSocialConnections,
} from '@/services/getSocialConnectionsWithProfile.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

export function useAllConnectionsFormattedWithProfiles(options?: { enabled?: boolean }) {
    const { accounts } = useThirdPartyProfileStore();
    const { data: connections, isLoading, refetch } = useAllConnections({ enabled: options?.enabled });
    const query = useQueries({
        queries: compact(
            SORTED_SOCIAL_SOURCES.map((source) => {
                if (!connections?.social) return;
                const ids = getProfileIdsFromSocialConnections(source, connections?.social);
                return {
                    queryKey: ['profiles', source, ids.sort()],
                    async queryFn() {
                        return getProfileFromSocialConnections(source, connections.social);
                    },
                    enabled: options?.enabled && !!connections?.social?.[source],
                };
            }),
        ),
        combine(result) {
            const isLoading = result.some((x) => x.isLoading);
            const error = first(compact(result.map((x) => x.error)));
            const data = connections
                ? {
                      ...connections,
                      socialConnections: compact(
                          result.map((query) => {
                              if (!query.data) return null;
                              const source = first(query.data)?.source;
                              if (!source) return null;
                              return {
                                  source,
                                  items: query.data
                                      .map((profile) => ({
                                          profile,
                                          connection: getConnections(source, connections.social).find((x) => {
                                              switch (source) {
                                                  case Source.Lens:
                                                      return isSameAddress((x as LensConnection).id, profile.profileId);
                                                  case Source.Bsky:
                                                  case Source.Farcaster:
                                                  case Source.Twitter:
                                                      return `${x.id}` === profile.profileId;
                                                  default:
                                                      unreachable(source);
                                              }
                                          })!,
                                          account: accounts.find((account) => isSameProfile(profile, account.profile)),
                                      }))
                                      .filter((x) => x.connection)
                                      .sort((a, b) => {
                                          function getPriority<
                                              T extends {
                                                  connection: { isDefault?: boolean };
                                              },
                                          >({ connection }: T) {
                                              return connection.isDefault ? 1 : 0;
                                          }

                                          return getPriority(b) - getPriority(a);
                                      }),
                              };
                          }),
                      ),
                  }
                : undefined;
            return {
                isLoading,
                error,
                data,
            };
        },
    });
    return {
        ...query,
        connections,
        connectionLoading: isLoading,
        refetch,
    };
}
