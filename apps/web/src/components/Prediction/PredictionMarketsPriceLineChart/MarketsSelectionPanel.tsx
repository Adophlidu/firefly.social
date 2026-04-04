'use client';

import CloseIcon from '@dimensiondev/assets/close.svg';
import { classNames, hexToRGBA } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useMount } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { MAX_MARKETS_COUNT_SELECTABLE } from '@/constants/bets.js';
import { type BetsMarketWithSettings } from '@/types/prediction.js';

interface MarketsSelectionPanelProps {
    markets: BetsMarketWithSettings[];
    toggleMarketSelection: (marketId: string, selected: boolean) => void;
}

const MARKET_ITEM_CLASSNAME = 'price-chart-market-item';

export const MarketsSelectionPanel = memo<MarketsSelectionPanelProps>(function MarketsSelectionPanel({
    markets,
    toggleMarketSelection,
}) {
    const selectedLength = markets.filter((m) => m.selected).length;

    useMount(() => {
        setTimeout(() => {
            const firstSelectedIndex = markets.findIndex((m) => m.selected);
            if (firstSelectedIndex !== -1) {
                const itemEls = document.getElementsByClassName(MARKET_ITEM_CLASSNAME);
                const firstSelectedEl = itemEls[firstSelectedIndex] as HTMLElement | undefined;
                if (firstSelectedEl) {
                    // @ts-ignore
                    firstSelectedEl.scrollIntoView({ behavior: 'smooth', block: 'center', container: 'nearest' });
                }
            }
        }, 100);
    });

    return (
        <>
            <h1 className="text-main text-lg font-bold !leading-[22px]">
                <Trans>Select up to {MAX_MARKETS_COUNT_SELECTABLE} options</Trans>
            </h1>
            {markets.map((market) => (
                <ClickableButton
                    key={market.id}
                    className={classNames(
                        'flex h-9 w-full items-center gap-2 rounded border-l-4 px-3 transition duration-100',
                        !market.selected ? 'bg-bg' : '',
                        MARKET_ITEM_CLASSNAME,
                    )}
                    style={{
                        borderColor: market.selected ? market.color : 'transparent',
                        backgroundColor: market.selected ? hexToRGBA(market.color, 0.2) : '',
                    }}
                    onClick={() => {
                        if (market.selected || selectedLength >= MAX_MARKETS_COUNT_SELECTABLE) return;
                        toggleMarketSelection(market.id, true);
                    }}
                >
                    <span className="text-main min-w-0 flex-1 truncate text-left text-sm font-medium">
                        {market.title}
                    </span>
                    {market.selected && selectedLength > 1 ? (
                        <CloseIcon
                            width={20}
                            height={20}
                            className="shrink-0"
                            onClick={() => {
                                if (!market.selected) return;
                                toggleMarketSelection(market.id, false);
                            }}
                        />
                    ) : null}
                </ClickableButton>
            ))}
        </>
    );
});
