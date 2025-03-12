import { t } from '@lingui/core/macro';
import { filter } from 'lodash-es';
import { useMemo } from 'react';

import { MuteType, Source } from '@/constants/enum.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

export interface MuteMenu {
    name: string;
    source: Source;
    type: MuteType;
    shouldHide: () => boolean;
}

export const useMuteMenuList = (): MuteMenu[] => {
    const profilesAll = useCurrentProfilesAll();

    const menuList = useMemo(() => {
        const fullMuteMenuList: MuteMenu[] = [
            {
                name: t`${resolveSourceName(Source.Farcaster)} muted users`,
                source: Source.Farcaster,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Farcaster],
            },
            {
                name: t`${resolveSourceName(Source.Farcaster)} muted channels`,
                source: Source.Farcaster,
                type: MuteType.Channel,
                shouldHide: () => !profilesAll[Source.Farcaster],
            },
            {
                name: t`${resolveSourceName(Source.Lens)} muted users`,
                source: Source.Lens,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Lens],
            },
            {
                name: t`${resolveSourceName(Source.Twitter)} muted users`,
                source: Source.Twitter,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Twitter],
            },
            {
                name: t`Muted wallets`,
                source: Source.Firefly,
                type: MuteType.Wallet,
                shouldHide: () => Object.values(profilesAll).every((profile) => !profile?.profileId),
            },
            {
                name: t`${resolveSourceName(Source.Bsky)} muted users`,
                source: Source.Bsky,
                type: MuteType.Profile,
                shouldHide: () => !profilesAll[Source.Bsky],
            },
        ];
        return filter(fullMuteMenuList, (menu) => !menu.shouldHide());
    }, [profilesAll]);

    return menuList;
};
