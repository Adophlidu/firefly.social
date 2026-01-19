import { classNames, hexToRGBA } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { Fragment, memo, useCallback } from 'react';

import CloseIcon from '@/assets/close.svg';
import SettingsIcon from '@/assets/settings.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { MAX_MARKETS_COUNT_SELECTABLE } from '@/constants/bets.js';
import type { BetsMarketWithSettings } from '@/types/prediction.js';

interface MarketSettingsProps {
    markets: BetsMarketWithSettings[];
    onMarketsChange: (markets: BetsMarketWithSettings[]) => void;
}

export const MarketSettings = memo<MarketSettingsProps>(function MarketSettings({ markets, onMarketsChange }) {
    const selectedLength = markets.filter((m) => m.selected).length;

    const toggleMarketSelection = useCallback(
        (marketId: string, selected: boolean) => {
            onMarketsChange(
                markets.map((m) => ({
                    ...m,
                    selected: m.id === marketId ? selected : m.selected,
                })),
            );
        },
        [markets, onMarketsChange],
    );

    return (
        <Popover as="div" className="relative">
            {({ open }) => (
                <>
                    <PopoverButton
                        className={classNames(
                            '-mt-1 flex size-6 items-center justify-center rounded hover:bg-bg',
                            open ? 'bg-bg' : '',
                        )}
                    >
                        <SettingsIcon width={16} height={16} />
                    </PopoverButton>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <PopoverPanel
                            portal={false}
                            anchor="bottom end"
                            style={{ height: 48 * markets.length + 32 + 22 }}
                            className="no-scrollbar absolute bottom-full right-0 z-30 w-[400px] !max-w-[80vw] translate-y-3 space-y-3 rounded-lg bg-lightBottom p-4 text-medium shadow-popover [--anchor-max-height:266px] dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                        >
                            <h1 className="text-lg font-bold !leading-[22px] text-main">
                                <Trans>Select up to {MAX_MARKETS_COUNT_SELECTABLE} options</Trans>
                            </h1>
                            {markets.map((market) => (
                                <ClickableButton
                                    key={market.id}
                                    className={classNames(
                                        'flex h-9 w-full items-center gap-2 rounded border-l-4 px-3 transition duration-100',
                                        !market.selected ? 'bg-bg' : '',
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
                                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-main">
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
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
});
