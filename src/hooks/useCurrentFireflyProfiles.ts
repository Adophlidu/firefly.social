import { useQuery } from '@tanstack/react-query';
import { compact, first, uniqBy } from 'lodash-es';
import { useMemo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { toFireflyIdentityId } from '@/helpers/isSameProfile.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { useCurrentProfileAll } from '@/hooks/useCurrentProfile.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';

export function useCurrentFireflyProfiles() {
    const currentProfileAll = useCurrentProfileAll();

    // convert currentProfileAll to currentFireflyProfiles
    return useMemo<FireflyProfile[]>(() => {
        const currentFarcasterProfile = currentProfileAll[Source.Farcaster];
        const currentLensProfile = currentProfileAll[Source.Lens];
        const currentTwitterProfile = currentProfileAll[Source.Twitter];
        const currentBskyProfile = currentProfileAll[Source.Bsky];

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
    }, [currentProfileAll]);
}

export function useCurrentFireflyProfilesAll() {
    const currentProfileAll = useCurrentProfileAll();
    const currentFireflyProfiles = useCurrentFireflyProfiles();

    const lensIdentity = resolveFireflyIdentity(currentProfileAll[Source.Lens]);
    const farcasterIdentity = resolveFireflyIdentity(currentProfileAll[Source.Farcaster]);
    const twitterIdentity = resolveFireflyIdentity(currentProfileAll[Source.Twitter]);
    const bskyIdentity = resolveFireflyIdentity(currentProfileAll[Source.Bsky]);

    const identity = first(compact([lensIdentity, farcasterIdentity, twitterIdentity, bskyIdentity]));

    const { data: profiles = EMPTY_LIST } = useQuery({
        queryKey: ['all-profiles', identity?.source, identity?.id],
        async queryFn() {
            if (!identity) return EMPTY_LIST;
            return await FireflyEndpointProvider.getAllPlatformProfileByIdentity(identity, false);
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!identity,
    });

    return useMemo(() => {
        return uniqBy([...currentFireflyProfiles, ...profiles], (x) => toFireflyIdentityId(x.identity));
    }, [currentFireflyProfiles, profiles]);
}
