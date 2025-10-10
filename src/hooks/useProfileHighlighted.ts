import { skipToken, useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';

import { SparksAccountStatus } from '@/constants/enum.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useProfileHighlighted(profile?: Profile | null, onlyActivated = false) {
    const enabled = !!profile;
    return useQuery({
        enabled,
        staleTime: Infinity,
        queryKey: ['profile-highlight-status', profile?.source, profile?.profileId, profile?.handle],
        queryFn: enabled
            ? async () => {
                  const records = await FireflyEndpointProvider.checkGenesisSparksAccounts(profile.source, [
                      { id: profile.profileId, handle: profile.handle },
                  ]);
                  return first(records?.infoList || []);
              }
            : skipToken,
        select: (data) =>
            data?.status === SparksAccountStatus.Activated ||
            (!onlyActivated && data?.status === SparksAccountStatus.NotActivated),
    });
}
