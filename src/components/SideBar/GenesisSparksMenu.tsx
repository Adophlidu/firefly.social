'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import SparksIcon from '@/assets/sparks-star.svg';
import SparksSelectedIcon from '@/assets/sparks-star-selected.svg';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface GenesisSparksMenuProps {
    isSelected: boolean;
    collapsed: boolean;
}

export const GenesisSparksMenu = memo<GenesisSparksMenuProps>(function GenesisSparksMenu({ isSelected, collapsed }) {
    const { currentProfileSession } = useFireflyProfileStore();

    const Icon = isSelected ? SparksSelectedIcon : SparksIcon;
    const uid = currentProfileSession?.profileId;

    return (
        <BaseMenuItem
            href={uid ? `/sparks/${uid}` : '/sparks'}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Genesis Sparks</Trans>}
            icon={<Icon width={20} height={20} className="text-main" />}
        />
    );
});
