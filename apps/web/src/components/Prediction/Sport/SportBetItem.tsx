'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { SportActivityCell } from '@/components/Prediction/Sport/SportActivityCell.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface SportBetItemProps {
    event: BetsEventDataForUI;
    platform: PredictionPlatform;
    className?: string;
    openLinkInNewTab?: boolean;
    onLinkClick?: () => void;
}

export const SportBetItem = memo(function SportBetItem({
    event,
    platform,
    className,
    openLinkInNewTab = true,
    onLinkClick,
}: SportBetItemProps) {
    const eventSlug = event.slug || event.id;
    const isMultiMarket = event.markets.length > 1;

    return (
        <Link
            className={classNames(
                'flex flex-col gap-3 rounded-2xl border border-line bg-primaryBottom p-4 hover:bg-bg',
                className,
            )}
            href={RouteResolver.betsEventDetail(platform, eventSlug, { multiple: isMultiMarket })}
            target={openLinkInNewTab ? '_blank' : '_self'}
            onClick={onLinkClick}
        >
            <SportActivityCell event={event} />
        </Link>
    );
});
