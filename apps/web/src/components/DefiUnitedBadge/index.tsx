'use client';

import BronzeBadge from '@dimensiondev/assets/defiunited/bronze.svg';
import GoldBadge from '@dimensiondev/assets/defiunited/gold.svg';
import SilverBadge from '@dimensiondev/assets/defiunited/silver.svg';
import { Trans } from '@lingui/react/macro';
import type { SVGAttributes } from 'react';

import { Tooltip } from '@/components/Tooltip.js';
import { DefiUnitedTier } from '@/constants/enum.js';

interface DefiUnitedBadgeProps {
    tier: DefiUnitedTier;
    className?: string;
}

const BADGE_SIZE = 15;

const badgeByTier: Record<DefiUnitedTier, React.FunctionComponent<SVGAttributes<SVGElement>>> = {
    [DefiUnitedTier.Bronze]: BronzeBadge,
    [DefiUnitedTier.Silver]: SilverBadge,
    [DefiUnitedTier.Gold]: GoldBadge,
};

export function DefiUnitedBadge({ tier, className }: DefiUnitedBadgeProps) {
    const Icon = badgeByTier[tier];
    return (
        <Tooltip content={<Trans>DeFiUnited Supporter</Trans>} placement="top">
            <Icon className={className} width={BADGE_SIZE} height={BADGE_SIZE} />
        </Tooltip>
    );
}
