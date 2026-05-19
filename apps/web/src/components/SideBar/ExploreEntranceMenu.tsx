'use client';

import ExploreSelectedIcon from '@dimensiondev/assets/explore.selected.svg';
import ExploreIcon from '@dimensiondev/assets/explore.svg';
import { DEFAULT_EXPLORE_TYPE } from '@dimensiondev/constants/computed';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, useMemo } from 'react';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useExploreTabs } from '@/hooks/useExploreTabs.js';

interface ExploreEntranceMenuProps {
    isSelected: boolean;
    collapsed: boolean;
    size?: number;
}

export const ExploreEntranceMenu = memo<ExploreEntranceMenuProps>(function ExploreEntranceMenu({
    isSelected,
    collapsed,
    size = 20,
}) {
    const exploreTabs = useExploreTabs();
    const href = useMemo(() => {
        const firstTab = first(exploreTabs);
        if (firstTab?.type !== DEFAULT_EXPLORE_TYPE) return resolveExploreUrl(DEFAULT_EXPLORE_TYPE);

        return firstTab.link || resolveExploreUrl(DEFAULT_EXPLORE_TYPE);
    }, [exploreTabs]);

    const Icon = isSelected ? ExploreSelectedIcon : ExploreIcon;

    return (
        <BaseMenuItem
            href={href}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Explore</Trans>}
            icon={<Icon width={size} height={size} />}
        />
    );
});
