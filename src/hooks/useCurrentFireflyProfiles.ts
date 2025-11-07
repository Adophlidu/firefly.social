import { compact, first, uniqBy } from 'lodash-es';
import { useMemo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { toFireflyIdentityId } from '@/helpers/isSameProfile.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { useAllProfiles } from '@/hooks/useAllProfiles.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';

function useCurrentFireflyProfiles() {
    const profilesAll = useCurrentProfilesAll();

    // convert currentProfileAll to currentFireflyProfiles
    return useMemo<FireflyProfile[]>(() => {
        const currentFarcasterProfile = profilesAll[Source.Farcaster];
        const currentLensProfile = profilesAll[Source.Lens];
        const currentTwitterProfile = profilesAll[Source.Twitter];
        const currentBskyProfile = profilesAll[Source.Bsky];

        return compact([
            currentFarcasterProfile
                ? {
                      identity: {
                          id: currentFarcasterProfile.profileId,
                          source: Source.Farcaster,
                      },
                      displayName: currentFarcasterProfile.handle,
                      __origin__: null,
                  }
                : undefined,
            currentLensProfile
                ? {
                      identity: {
                          id: currentLensProfile.handle,
                          source: Source.Lens,
                      },
                      displayName: currentLensProfile.handle,
                      __origin__: null,
                  }
                : undefined,
            currentTwitterProfile
                ? {
                      identity: {
                          id: currentTwitterProfile.profileId,
                          source: Source.Twitter,
                      },
                      displayName: currentTwitterProfile.handle,
                      __origin__: null,
                  }
                : undefined,
            currentBskyProfile
                ? {
                      identity: {
                          id: currentBskyProfile.handle,
                          source: Source.Bsky,
                      },
                      displayName: currentBskyProfile.handle,
                      __origin__: null,
                  }
                : undefined,
        ]).sort(
            (a, b) =>
                SORTED_SOCIAL_SOURCES.indexOf(a.identity.source as SocialSource) -
                SORTED_SOCIAL_SOURCES.indexOf(b.identity.source as SocialSource),
        );
    }, [profilesAll]);
}

export function useCurrentFireflyProfilesAll() {
    const profilesAll = useCurrentProfilesAll();
    const fireflyProfiles = useCurrentFireflyProfiles();

    const lensIdentity = resolveFireflyIdentity(profilesAll[Source.Lens]);
    const farcasterIdentity = resolveFireflyIdentity(profilesAll[Source.Farcaster]);
    const twitterIdentity = resolveFireflyIdentity(profilesAll[Source.Twitter]);
    const bskyIdentity = resolveFireflyIdentity(profilesAll[Source.Bsky]);

    const identity = first(compact([lensIdentity, farcasterIdentity, twitterIdentity, bskyIdentity]));

    const { data: profiles = EMPTY_LIST } = useAllProfiles(identity);

    return useMemo(() => {
        return uniqBy([...fireflyProfiles, ...profiles], (x) => toFireflyIdentityId(x.identity));
    }, [fireflyProfiles, profiles]);
}
