'use client';

import CenterIcon from '@dimensiondev/assets/center.svg';
import RefreshIcon from '@dimensiondev/assets/refresh.svg';
import SwitchIcon from '@dimensiondev/assets/switch.svg';
import ToggleIcon from '@dimensiondev/assets/toggle.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { IconButton } from '@/components/IconButton.js';
import { SPREAD_SETTING_OPTIONS } from '@/constants/bets.js';
import type { BetsMarketDataForUI, MarketOrderBookSpread } from '@/types/prediction.js';

interface OrderBookHeaderProps {
    outcomeId: string;
    loading: boolean;
    market: BetsMarketDataForUI;
    showSpreadSetting: boolean;
    spread: MarketOrderBookSpread;
    onSpreadChange: (spread: MarketOrderBookSpread) => void;
    onRefresh: () => void;
    onScrollToCenter: () => void;
    onOutcomeChange: (outcomeId: string) => void;
}

export const OrderBookHeader = memo<OrderBookHeaderProps>(function OrderBookHeader({
    market,
    outcomeId,
    loading,
    showSpreadSetting,
    spread,
    onSpreadChange,
    onRefresh,
    onScrollToCenter,
    onOutcomeChange,
}) {
    const outcomeLabel = market.outcomes.find((x) => x.id === outcomeId)?.label;

    const onToggleOutcome = useCallback(() => {
        const currentIndex = market.outcomes.findIndex((x) => x.id === outcomeId);
        const nextIndex = (currentIndex + 1) % market.outcomes.length;
        const nextOutcomeId = market.outcomes[nextIndex].id;
        onOutcomeChange(nextOutcomeId);
    }, [market.outcomes, outcomeId, onOutcomeChange]);
    const onToggleSpread = useCallback(() => {
        const currentIndex = SPREAD_SETTING_OPTIONS.findIndex((x) => x === spread);
        const nextIndex = (currentIndex + 1) % SPREAD_SETTING_OPTIONS.length;
        const nextSpread = SPREAD_SETTING_OPTIONS[nextIndex];
        onSpreadChange(nextSpread);
    }, [spread, onSpreadChange]);

    return (
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center text-second">
                <span className="mr-1 min-w-0 truncate text-sm font-semibold text-main">
                    <Trans>Trade {outcomeLabel || '-'}</Trans>
                </span>
                <IconButton disabled={loading} tooltip={<Trans>Toggle trade view</Trans>} onClick={onToggleOutcome}>
                    <ToggleIcon width={18} height={18} />
                </IconButton>
                <IconButton disabled={loading} tooltip={<Trans>Scroll to center</Trans>} onClick={onScrollToCenter}>
                    <CenterIcon width={18} height={18} />
                </IconButton>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-1">
                <IconButton disabled={loading} tooltip={<Trans>Refresh</Trans>} onClick={onRefresh}>
                    <RefreshIcon
                        width={18}
                        height={18}
                        className={classNames('text-second', loading ? 'animate-spin' : '')}
                    />
                </IconButton>
                {showSpreadSetting ? (
                    <ClickableButton
                        className="flex h-[22px] items-center gap-1 rounded-full bg-lightBg px-2"
                        disabled={loading}
                        onClick={onToggleSpread}
                    >
                        <span className="text-xs font-medium text-second">
                            <Trans>Spread {spread}¢</Trans>
                        </span>
                        <SwitchIcon width={12} height={12} className="text-main" />
                    </ClickableButton>
                ) : null}
            </div>
        </div>
    );
});
