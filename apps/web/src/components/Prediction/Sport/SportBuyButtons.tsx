'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { abbreviateOutcomeLabel, formatLine } from '@/helpers/prediction/sportScoreUtils.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

function extractSpreadValue(label: string): string | undefined {
    const match = label.match(/([+-]?\d+\.?\d*)\s*$/);
    return match?.[1];
}

function formatSpreadLabel(line: number, index: number): string {
    const absLine = Math.abs(line);
    // outcome 0 gets the sign of line, outcome 1 gets the opposite
    const positive = index === 0 ? line >= 0 : line < 0;
    return positive ? `+${absLine}` : `-${absLine}`;
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
    line?: number;
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
    line,
}: SportBuyButtonsProps) {
    const outcomes = market.outcomes;
    const isResolved = market.isResolved || market.isClosed;
    if (isResolved || disabled) return null;

    const compact = size === 'compact' || !!showDraw;
    const isSpread = sectionType === SportMarketGroupType.Spread;
    const isTotal = sectionType === SportMarketGroupType.Total;
    const getOutcomeMeta = (index: number, fallbackLabel: string, fallbackColor: string) => {
        const team = outcomeTeams?.[index];
        const abbreviation = team?.abbreviation || team?.name;
        const defaultLabel = abbreviation || outcomes[index]?.label || fallbackLabel;
        const spreadLabel =
            isSpread && line != null // eslint-disable-line eqeqeq -- != null narrows both null and undefined
                ? [abbreviation, formatSpreadLabel(line, index)].filter(Boolean).join(' ')
                : isSpread
                  ? extractSpreadValue(outcomes[index]?.label || '') || defaultLabel
                  : defaultLabel;
        // Abbreviate Over/Under for total-type markets, appending the line value
        const finalLabel = isTotal
            ? line != null // eslint-disable-line eqeqeq -- != null narrows both null and undefined
                ? `${abbreviateOutcomeLabel(defaultLabel)} ${formatLine(line, false)}`
                : abbreviateOutcomeLabel(defaultLabel)
            : spreadLabel;
        return {
            label: finalLabel,
            color: team?.color || fallbackColor,
        };
    };
    // Order buttons home → (draw) → away so Spread buttons match the moneyline /
    // home-away order. The original outcome index is kept when building
    // each label, so a spread's sign (derived from line + index) stays correct
    // for its team — only the visual position changes.
    const homeOutcomeIndex = outcomeTeams?.findIndex((team) => team && homeTeam && team === homeTeam) ?? -1;
    const otherIndex = homeOutcomeIndex === 0 ? 1 : 0;
    const orderedTeamIndices = homeOutcomeIndex >= 0 && homeOutcomeIndex <= 1 ? [homeOutcomeIndex, otherIndex] : [0, 1];
    const showDrawOutcome = !!showDraw && !!outcomes[2];
    const renderIndices = showDrawOutcome ? [orderedTeamIndices[0], 2, orderedTeamIndices[1]] : orderedTeamIndices;

    return (
        <div
            className={classNames('flex gap-2', {
                'justify-center': compact,
                'max-md:w-full': !!responsiveFullWidth,
            })}
        >
            {renderIndices.map((index) => {
                const isDrawOutcome = index === 2;
                const isHome = index === orderedTeamIndices[0];
                const fallbackLabel = isDrawOutcome ? 'Draw' : isHome ? 'Home' : 'Away';
                const fallbackColor = isDrawOutcome
                    ? '#9CA3AF'
                    : isHome
                      ? homeTeam?.color || '#E74C3C'
                      : awayTeam?.color || '#2ECC71';
                const meta = getOutcomeMeta(index, fallbackLabel, fallbackColor);
                // Moneyline middle is always "Draw"; localize it (Gamma's title is messy).
                const isMoneylineDraw = isDrawOutcome && market.sportsMarketType?.toLowerCase() === 'moneyline';
                return (
                    <SportBuyButton
                        key={index}
                        slug={outcomes[index]?.slug || market.slug}
                        outcome={outcomes[index]?.slug ? 0 : index}
                        label={isMoneylineDraw ? <Trans>Draw</Trans> : meta.label}
                        price={outcomes[index]?.price}
                        color={meta.color}
                        compact={compact}
                        variant={variant}
                        softColor={softColor}
                        conditionId={market.conditionId}
                        eventSlug={eventSlug}
                        responsiveFullWidth={responsiveFullWidth}
                        isDraw={isDrawOutcome}
                    />
                );
            })}
        </div>
    );
});

interface SportBuyButtonProps {
    slug?: string;
    outcome: number;
    label: ReactNode;
    price?: string;
    color: string;
    compact?: boolean;
    variant: 'soft' | 'solid';
    softColor?: boolean;
    conditionId?: string;
    eventSlug?: string;
    responsiveFullWidth?: boolean;
    isDraw?: boolean;
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
    isDraw,
}: SportBuyButtonProps) {
    const isDarkMode = useIsDarkMode();
    const [{ loading }, handleOpen] = useAsyncFn(async () => {
        if (!slug) return;
        await openPredictionPage(slug, { outcome, conditionId, eventSlug });
    }, [slug, outcome, conditionId, eventSlug]);

    return (
        <TextOverflowTooltip content={<span className="text-sm font-bold uppercase">{label}</span>}>
            {(ref) => (
                <ClickableButton
                    className={classNames(
                        'flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-lg px-2 py-1.5 text-sm font-bold leading-6',
                        variant === 'solid'
                            ? classNames(compact ? 'w-[120px] flex-none' : 'w-32 flex-none', {
                                  'max-md:w-auto max-md:flex-1': !!responsiveFullWidth,
                              })
                            : '',
                        variant === 'soft' ? (compact ? 'max-w-[120px] flex-none' : 'flex-1') : '',
                    )}
                    style={
                        softColor
                            ? {
                                  backgroundColor: isDarkMode ? 'rgb(38 42 52)' : 'rgb(230 230 237)',
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
                    <span className={classNames('min-w-0 truncate uppercase', isDraw ? 'shrink-0' : '')} ref={ref}>
                        {label}
                    </span>
                    <span className="shrink-0">{price ? formatCents(price) : ''}</span>
                </ClickableButton>
            )}
        </TextOverflowTooltip>
    );
});
