import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment, memo, useCallback } from 'react';

import SettingsIcon from '@/assets/settings.svg';
import { MarketsSelectionPanel } from '@/components/Prediction/PredictionMarketsPriceLineChart/MarketsSelectionPanel.js';
import type { BetsMarketWithSettings } from '@/types/prediction.js';

interface MarketSettingsProps {
    markets: BetsMarketWithSettings[];
    onMarketsChange: (markets: BetsMarketWithSettings[]) => void;
}

export const MarketSettings = memo<MarketSettingsProps>(function MarketSettings({ markets, onMarketsChange }) {
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
                            <MarketsSelectionPanel markets={markets} toggleMarketSelection={toggleMarketSelection} />
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
});
