'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

function extractSpreadValue(label: string): string | undefined {
    const match = label.match(/([+-]?\d+\.?\d*)\s*$/);
    return match?.[1];
}

interface SportBuyButtonsProps {
    market: BetsMarketDataForUI;
    homeTeam?: { abbreviation?: string; color?: string };
    awayTeam?: { abbreviation?: string; color?: string };
    outcomeTeams?: Array<{ abbreviation?: string; color?: string; name?: string } | undefined>;
    sectionType?: SportMarketGroupType;
    eventSlug?: string;
    showDraw?: boolean;
    disabled?: boolean;
    size?: 'default' | 'compact';
    variant?: 'soft' | 'solid';
    softColor?: boolean;
    responsiveFullWidth?: boolean;
}

function formatCents(price: string): string {
    const num = Number.parseFloat(price);
    if (Number.isNaN(num)) return '50¢';
    const cents = (Math.floor(num * 1000) / 10).toFixed(1);
    return `${cents}¢`;
}

export const SportBuyButtons = memo(function SportBuyButtons({
    market,
    homeTeam,
    awayTeam,
    outcomeTeams,
    sectionType,
    eventSlug,
    showDraw,
    disabled,
    size,
    variant = 'soft',
    softColor,
    responsiveFullWidth,
}: SportBuyButtonsProps) {
    const outcomes = market.outcomes;
    const isResolved = market.isResolved || market.isClosed;
    if (isResolved || disabled) return null;

    const compact = size === 'compact' || !!showDraw;
    const isSpread = sectionType === SportMarketGroupType.Spread;
    const getOutcomeMeta = (index: number, fallbackLabel: string, fallbackColor: string) => {
        const team = outcomeTeams?.[index];
        const defaultLabel = team?.abbreviation || team?.name || outcomes[index]?.label || fallbackLabel;
        const spreadLabel = isSpread ? extractSpreadValue(outcomes[index]?.label || '') || defaultLabel : defaultLabel;
        return {
            label: spreadLabel,
            color: team?.color || fallbackColor,
        };
    };
    const home = getOutcomeMeta(0, 'Home', homeTeam?.color || '#E74C3C');
    const away = getOutcomeMeta(1, 'Away', awayTeam?.color || '#2ECC71');
    const draw = getOutcomeMeta(2, 'Draw', '#9CA3AF');

    return (
        <div
            className={classNames('flex gap-2', {
                'justify-center': compact,
                'max-md:w-full': !!responsiveFullWidth,
            })}
        >
            <SportBuyButton
                slug={outcomes[0]?.slug || market.slug}
                outcome={outcomes[0]?.slug ? 0 : 0}
                label={home.label}
                price={outcomes[0]?.price}
                color={home.color}
                compact={compact}
                variant={variant}
                softColor={softColor}
                conditionId={market.conditionId}
                eventSlug={eventSlug}
                responsiveFullWidth={responsiveFullWidth}
            />
            {showDraw && outcomes[2] ? (
                <SportBuyButton
                    slug={outcomes[2]?.slug || market.slug}
                    outcome={outcomes[2]?.slug ? 0 : 2}
                    label={draw.label}
                    price={outcomes[2].price}
                    color={draw.color}
                    compact={compact}
                    variant={variant}
                    softColor={softColor}
                    conditionId={market.conditionId}
                    eventSlug={eventSlug}
                    responsiveFullWidth={responsiveFullWidth}
                />
            ) : null}
            <SportBuyButton
                slug={outcomes[1]?.slug || market.slug}
                outcome={outcomes[1]?.slug ? 0 : 1}
                label={away.label}
                price={outcomes[1]?.price}
                color={away.color}
                compact={compact}
                variant={variant}
                softColor={softColor}
                conditionId={market.conditionId}
                eventSlug={eventSlug}
                responsiveFullWidth={responsiveFullWidth}
            />
        </div>
    );
});

interface SportBuyButtonProps {
    slug?: string;
    outcome: number;
    label: string;
    price?: string;
    color: string;
    compact?: boolean;
    variant: 'soft' | 'solid';
    softColor?: boolean;
    conditionId?: string;
    eventSlug?: string;
    responsiveFullWidth?: boolean;
}

const SportBuyButton = memo(function SportBuyButton({
    slug,
    outcome,
    label,
    price,
    color,
    compact,
    variant,
    softColor,
    conditionId,
    eventSlug,
    responsiveFullWidth,
}: SportBuyButtonProps) {
    const [{ loading }, handleOpen] = useAsyncFn(async () => {
        if (!slug) return;
        await openPredictionPage(slug, { outcome, conditionId, eventSlug });
    }, [slug, outcome, conditionId, eventSlug]);

    return (
        <ClickableButton
            className={classNames(
                'min-w-0 overflow-hidden rounded-lg px-2 py-1.5 text-sm font-bold leading-6',
                variant === 'solid'
                    ? classNames(compact ? 'w-[100px] flex-none' : 'w-32 flex-none', {
                          'max-md:w-auto max-md:flex-1': !!responsiveFullWidth,
                      })
                    : '',
                variant === 'soft' ? (compact ? 'max-w-[100px] flex-none' : 'flex-1') : '',
            )}
            style={
                softColor
                    ? {
                          backgroundColor: 'rgb(var(--color-bg03, 230 230 237))',
                          color: 'var(--color-light-main, #181818)',
                      }
                    : variant === 'soft'
                      ? { backgroundColor: `${color}20`, color }
                      : { backgroundColor: color, color: '#fff' }
            }
            data-prevent-progress
            type="button"
            loading={loading}
            onClick={() => {
                if (!slug || loading) return;
                handleOpen();
            }}
        >
            <TextOverflowTooltip content={`${label} ${price ? formatCents(price) : ''}`}>
                <span className="block truncate uppercase">
                    {label} {price ? formatCents(price) : ''}
                </span>
            </TextOverflowTooltip>
        </ClickableButton>
    );
});
