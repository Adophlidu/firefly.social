import type { ProfilePageSource } from '@dimensiondev/enums';
import { skipToken, useQuery } from '@tanstack/react-query';

import { checkFifaCampAccount } from '@/batches/checkFifaCampAccounts.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getFifaCampAvatarFromInfo } from '@/helpers/isFifaCampAvatarEligible.js';
import { isWorldCupEnabled } from '@/helpers/isWorldCupEnabled.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

type FifaCampProfileInput =
    | {
          source: ProfilePageSource;
          profileId: string;
          handle: string;
          fifaCampCountryCode?: string;
          fifaCampCountryLogo?: string;
      }
    | Profile
    | null;

export function useFifaCampAvatar(profile?: FifaCampProfileInput) {
    const prefilled =
        profile &&
        'fifaCampCountryCode' in profile &&
        profile.fifaCampCountryCode &&
        'fifaCampCountryLogo' in profile &&
        profile.fifaCampCountryLogo
            ? {
                  countryCode: profile.fifaCampCountryCode,
                  flagUrl: profile.fifaCampCountryLogo.trim(),
              }
            : undefined;

    const enabled = isWorldCupEnabled() && !!profile && !prefilled;

    const query = useQuery({
        enabled,
        staleTime: STALE_TIMES.INFINITY,
        queryKey: ['fifa-camp-status', 'v2', profile?.source, profile?.profileId, profile?.handle],
        queryFn: enabled
            ? async () => {
                  return checkFifaCampAccount(profile.source, profile.profileId, profile.handle);
              }
            : skipToken,
        select: (data) => getFifaCampAvatarFromInfo(data),
    });

    const campAvatar = prefilled ?? query.data;

    return {
        ...query,
        data: campAvatar?.countryCode,
        flagUrl: campAvatar?.flagUrl,
        isLoading: enabled ? query.isLoading : false,
    };
}
