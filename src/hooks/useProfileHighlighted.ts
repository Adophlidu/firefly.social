import { skipToken, useQuery } from '@tanstack/react-query';

import { type ProfilePageSource, SparksAccountStatus } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { checkGenesisSparksAccount } from '@/providers/firefly/endpoint/checkGenesisSparksAccounts.js';

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
        staleTime: STALE_TIMES.INFINITY,
        queryKey: ['profile-highlight-status', profile?.source, profile?.profileId, profile?.handle],
        queryFn: enabled
            ? async () => {
                  const record = await checkGenesisSparksAccount(profile.source, profile.profileId, profile.handle);
                  return record;
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
