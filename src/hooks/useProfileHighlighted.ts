import { skipToken, useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';

import { type ProfilePageSource, SparksAccountStatus } from '@/constants/enum.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

const checkedAccountIds = new Set<string>();

export function useProfileHighlighted(
    profile?: {
        source: ProfilePageSource;
        profileId: string;
        handle: string;
    } | null,
    onlyActivated = false,
    accountId?: string,
) {
    const enabled = !!profile;
    const query = useQuery({
        enabled,
        staleTime: Infinity,
        queryKey: ['profile-highlight-status', profile?.source, profile?.profileId, profile?.handle],
        queryFn: enabled
            ? async () => {
                  const records = await fireflyEndpointProvider.checkGenesisSparksAccounts(profile.source, [
                      { id: profile.profileId, handle: profile.handle },
                  ]);
                  return first(records?.infoList || []);
              }
            : skipToken,
        select: (data) => {
            if (data?.status === SparksAccountStatus.Activated && accountId && !checkedAccountIds.has(accountId)) {
                checkedAccountIds.add(accountId);
            }

            return (
                data?.status === SparksAccountStatus.Activated ||
                (!onlyActivated && data?.status === SparksAccountStatus.NotActivated)
            );
        },
    });

    return {
        ...query,
        data: accountId && checkedAccountIds.has(accountId) ? true : query.data,
    };
}
