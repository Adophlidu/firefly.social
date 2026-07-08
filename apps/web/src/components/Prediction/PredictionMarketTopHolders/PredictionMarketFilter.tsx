'use client';

import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { Fragment, memo } from 'react';

import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';
import { capturePolymarketEventTopHolderChangeMarketClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionMarketFilterProps {
    markets: BetsMarketDataForUI[];
    marketId: string;
    onSelect: (marketId: string) => void;
    eventSlug?: string;
    eventTitle?: string;
}

export const PredictionMarketFilter = memo<PredictionMarketFilterProps>(function PredictionMarketFilter({
    markets,
    marketId,
    onSelect,
    eventSlug,
    eventTitle,
}) {
    const resolveTeamName = useLocalizedSportsTeamName();
    const market = markets.find((m) => m.id === marketId);

    return (
        <Popover as="div" className="relative px-4 pt-4">
            {({ close }) => (
                <>
                    <PopoverButton className="flex min-h-9 min-w-32 cursor-pointer items-center justify-between gap-1 rounded-md border border-secondaryLine bg-bottom px-2 py-1 text-sm font-semibold text-main focus:outline-none">
                        <span>{market?.title ? resolveTeamName(market.title) : ''}</span>
                        <ChevronDownIcon className="size-4 text-secondary" />
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
                            anchor="top start"
                            style={{ height: 38 * markets.length + 32 + 40 }}
                            className="no-scrollbar absolute bottom-full right-0 z-30 w-[400px] !max-w-[80vw] -translate-y-3 rounded-lg bg-lightBottom py-4 text-medium shadow-popover [--anchor-max-height:224px] dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                        >
                            <h1 className="h-7 px-4 text-lg font-bold text-main">
                                <Trans>Markets</Trans>
                            </h1>
                            <div className="mt-2 space-y-1">
                                {markets.map((market) => (
                                    <ClickableButton
                                        key={market.id}
                                        className={classNames(
                                            'flex h-[34px] w-full items-center gap-3 truncate px-4 transition duration-150 ease-in hover:bg-lightBg',
                                            market.id === marketId ? 'font-semibold' : '',
                                        )}
                                        onClick={() => {
                                            if (eventSlug && eventTitle) {
                                                capturePolymarketEventTopHolderChangeMarketClick(
                                                    eventSlug,
                                                    eventTitle,
                                                    market.slug || market.id,
                                                    market.title,
                                                    '',
                                                );
                                            }
                                            onSelect(market.id);
                                            close();
                                        }}
                                    >
                                        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-main">
                                            {resolveTeamName(market.title)}
                                        </span>
                                        <CircleCheckboxIcon checked={market.id === marketId} />
                                    </ClickableButton>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
});
