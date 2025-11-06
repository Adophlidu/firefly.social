'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import urlcat from 'urlcat';

import SparksIcon from '@/assets/sparks-star.svg';
import SparksSelectedIcon from '@/assets/sparks-star-selected.svg';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { getSparksAccountDetails } from '@/providers/firefly/endpoint/getSparksAccountDetails.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface GenesisSparksMenuProps {
    isSelected: boolean;
    collapsed: boolean;
}

export const GenesisSparksMenu = memo<GenesisSparksMenuProps>(function GenesisSparksMenu({ isSelected, collapsed }) {
    const { currentProfileSession } = useFireflyProfileStore();

    const Icon = isSelected ? SparksSelectedIcon : SparksIcon;
    const uid = currentProfileSession?.profileId;

    const { data } = useQuery({
        queryKey: ['sparks-account', uid],
        queryFn: () => {
            if (!uid) return;
            return getSparksAccountDetails(`${uid}`);
        },
    });

    const isOgUser = !!data?.OgList?.length;
    const isFansUser = !!data?.FansList?.length;

    const href = useMemo(() => {
        if (uid && (isOgUser || isFansUser))
            return urlcat('/sparks/:uid', { uid, eligible: isOgUser ? 'KOL' : isFansUser ? 'Fans' : 'No' });
        return '/sparks';
    }, [uid, isOgUser, isFansUser]);

    return (
        <BaseMenuItem
            href={href}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Genesis Sparks</Trans>}
            icon={<Icon width={20} height={20} className="text-main" />}
        />
    );
});
