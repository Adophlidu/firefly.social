import { Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { MuteType } from '@/constants/enum.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

export function useMuteMenuList() {
    const profilesAll = useCurrentProfilesAll();

    return useMemo(() => {
        return [
            {
                name: <Trans>{resolveSourceName(Source.Farcaster)} muted users</Trans>,
                source: Source.Farcaster,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Farcaster],
            },
            {
                name: <Trans>{resolveSourceName(Source.Farcaster)} muted channels</Trans>,
                source: Source.Farcaster,
                type: MuteType.Channel,
                shouldHide: () => !profilesAll[Source.Farcaster],
            },
            {
                name: <Trans>{resolveSourceName(Source.Lens)} muted users</Trans>,
                source: Source.Lens,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Lens],
            },
            {
                name: <Trans>{resolveSourceName(Source.Twitter)} muted users</Trans>,
                source: Source.Twitter,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Twitter],
            },
            {
                name: <Trans>Muted wallets</Trans>,
                source: Source.Firefly,
                type: MuteType.Wallet,
                shouldHide: () => Object.values(profilesAll).every((profile) => !profile?.profileId),
            },
            {
                name: <Trans>{resolveSourceName(Source.Bsky)} muted users</Trans>,
                source: Source.Bsky,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Bsky],
            },
        ].filter((menu) => !menu.shouldHide());
    }, [profilesAll]);
}
