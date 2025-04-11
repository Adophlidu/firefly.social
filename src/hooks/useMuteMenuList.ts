import { msg } from '@lingui/core/macro';
import { useMemo } from 'react';

import { MuteType, Source } from '@/constants/enum.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

export function useMuteMenuList() {
    const profilesAll = useCurrentProfilesAll();

    return useMemo(() => {
        return [
            {
                name: msg`${resolveSourceName(Source.Farcaster)} muted users`,
                source: Source.Farcaster,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Farcaster],
            },
            {
                name: msg`${resolveSourceName(Source.Farcaster)} muted channels`,
                source: Source.Farcaster,
                type: MuteType.Channel,
                shouldHide: () => !profilesAll[Source.Farcaster],
            },
            {
                name: msg`${resolveSourceName(Source.Lens)} muted users`,
                source: Source.Lens,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Lens],
            },
            {
                name: msg`${resolveSourceName(Source.Twitter)} muted users`,
                source: Source.Twitter,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Twitter],
            },
            {
                name: msg`Muted wallets`,
                source: Source.Firefly,
                type: MuteType.Wallet,
                shouldHide: () => Object.values(profilesAll).every((profile) => !profile?.profileId),
            },
            {
                name: msg`${resolveSourceName(Source.Bsky)} muted users`,
                source: Source.Bsky,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Bsky],
            },
        ].filter((menu) => !menu.shouldHide());
    }, [profilesAll]);
}
