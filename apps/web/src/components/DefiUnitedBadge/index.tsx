'use client';

import BronzeBadge from '@dimensiondev/assets/defiunited/bronze.svg';
import GoldBadge from '@dimensiondev/assets/defiunited/gold.svg';
import SilverBadge from '@dimensiondev/assets/defiunited/silver.svg';
import { DefiUnitedTier } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import type { SVGAttributes } from 'react';

import { Tooltip } from '@/components/Tooltip.js';

interface DefiUnitedBadgeProps {
    tier: DefiUnitedTier;
    symbol?: string;
    amount?: string;
    className?: string;
}

const BADGE_SIZE = 15;

const badgeByTier: Record<DefiUnitedTier, React.FunctionComponent<SVGAttributes<SVGElement>>> = {
    [DefiUnitedTier.Bronze]: BronzeBadge,
    [DefiUnitedTier.Silver]: SilverBadge,
    [DefiUnitedTier.Gold]: GoldBadge,
};

export function DefiUnitedBadge({ tier, symbol, amount, className }: DefiUnitedBadgeProps) {
    const Icon = badgeByTier[tier];
    const formattedAmount = amount ? parseFloat(amount).toString() : undefined;
    const tooltipContent =
        formattedAmount && symbol ? (
            <Trans>
                Donated {formattedAmount} {symbol} to DeFiUnited
            </Trans>
        ) : (
            <Trans>DeFiUnited Supporter</Trans>
        );
    return (
        <Tooltip content={tooltipContent} placement="top">
            <Icon className={className} width={BADGE_SIZE} height={BADGE_SIZE} />
        </Tooltip>
    );
}
