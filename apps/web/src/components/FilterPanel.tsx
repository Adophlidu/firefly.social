'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import CheckIcon from '@dimensiondev/assets/check.svg';
import EvmChainsIcon from '@dimensiondev/assets/evm-chains.svg';
import FilterIcon from '@dimensiondev/assets/filter.svg';
import { classNames, getEnumAsArray } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo, useState } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { NetworkType, TimeRangeFilter } from '@/constants/enum.js';
import { resolveTimeRangeName, resolveTimeRangeShortName } from '@/helpers/resolveTimeRangeName.js';
import { captureChainFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { chainsList } from '@/store/useTransactionsStore.js';

interface FilterPanelProps {
    selectedChainId: number | null;
    selectedTimeRange?: TimeRangeFilter;
    networkType?: NetworkType;
    validChains?: Array<{ id: number; name: string; networkType: NetworkType }>;
    onChainChange: (chainId: number | null) => void;
    onTimeRangeChange?: (timeRange: TimeRangeFilter) => void;
    className?: string;
    iconSize?: number;
    chainIconSize?: number;
    enableTimeRange?: boolean;
    disableChainChange?: boolean;
}

export const FilterPanel = memo(function FilterPanel({
    selectedChainId,
    networkType,
    validChains,
    onChainChange,
    selectedTimeRange,
    onTimeRangeChange,
    className,
    disableChainChange = false,
    enableTimeRange = false,
    iconSize = 24,
    chainIconSize = 20,
}: FilterPanelProps) {
    const chains = validChains ?? chainsList;
    const [expanded, setExpanded] = useState(false);
    const [timeRangeExpanded, setTimeRangeExpanded] = useState(false);
    const Icon = useMemo(() => {
        if (selectedChainId === 101) {
            return <ChainIcon chainId={101} networkType={NetworkType.Solana} size={chainIconSize} />;
        } else if (selectedChainId === null) {
            return <FilterIcon width={iconSize} height={iconSize} />;
        }
        return <ChainIcon chainId={selectedChainId} size={chainIconSize} />;
    }, [selectedChainId, iconSize, chainIconSize]);

    return (
        <Popover className={classNames('relative flex items-center justify-center', className)}>
            <PopoverButton className="flex items-center gap-2 p-2 outline-none">
                {selectedTimeRange && enableTimeRange ? (
                    <span className="text-main flex items-center text-xs leading-[18px]">
                        {resolveTimeRangeShortName(selectedTimeRange)}
                    </span>
                ) : null}
                {Icon}
            </PopoverButton>
            <PopoverPanel
                className="bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom absolute right-0 top-10 z-50 flex min-w-[320px] flex-col gap-2 rounded-lg"
                transition
            >
                <div className="flex flex-col gap-4 p-4">
                    <div className="text-second text-sm font-normal">
                        <Trans>Chain filter</Trans>
                    </div>
                    <div
                        className="bg-bg flex h-[30px] cursor-pointer items-center rounded-lg px-3 py-[7px]"
                        onClick={() => {
                            if (disableChainChange) return;
                            setExpanded(!expanded);
                        }}
                    >
                        {selectedChainId ? (
                            <div className="text-main flex items-center gap-2 text-sm font-normal">
                                <ChainIcon chainId={selectedChainId} size={15} networkType={networkType} />
                                {chains.find(({ id }) => id === selectedChainId)?.name}
                            </div>
                        ) : (
                            <div className="text-main flex items-center gap-2 text-sm font-normal">
                                <EvmChainsIcon className="size-[18px]" />
                                <Trans>All Chains</Trans>
                            </div>
                        )}

                        {!disableChainChange ? (
                            <ArrowDownIcon className={classNames('ml-auto size-4', expanded ? 'rotate-180' : '')} />
                        ) : null}
                    </div>
                    {expanded ? (
                        <div className="flex flex-col gap-0.5">
                            <div
                                className="hover:bg-bg flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg bg-clip-padding p-2"
                                onClick={() => {
                                    if (disableChainChange) return;
                                    onChainChange(null);
                                    setExpanded(false);
                                }}
                            >
                                <div className="text-main flex h-[20px] items-center gap-2 text-sm font-normal">
                                    <EvmChainsIcon className="size-[18px]" />
                                    <span>
                                        <Trans>All Chains</Trans>
                                    </span>
                                </div>
                                <div className="ml-auto">
                                    {!selectedChainId ? (
                                        <CheckIcon width={15} height={15} className="text-highlight" />
                                    ) : null}
                                </div>
                            </div>
                            {chains.map(({ id, name, networkType }) => (
                                <div
                                    key={id}
                                    className="hover:bg-bg flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg bg-clip-padding p-2"
                                    onClick={() => {
                                        if (disableChainChange) return;
                                        onChainChange(id);
                                        setExpanded(false);
                                        captureChainFilterTabEvent('home', `${id}`, name);
                                    }}
                                >
                                    <div className="text-main flex h-[20px] items-center gap-2 text-sm font-normal">
                                        <ChainIcon chainId={id} size={15} networkType={networkType} />
                                        <span>{name}</span>
                                    </div>
                                    <div className="ml-auto">
                                        {selectedChainId === id ? (
                                            <CheckIcon width={15} height={15} className="text-highlight" />
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {enableTimeRange ? (
                        <>
                            <div className="text-second text-sm font-normal">
                                <Trans>Time range filter</Trans>
                            </div>
                            <div
                                className="bg-bg flex h-[30px] cursor-pointer items-center rounded-lg px-3 py-[7px]"
                                onClick={() => {
                                    setTimeRangeExpanded(!timeRangeExpanded);
                                }}
                            >
                                {resolveTimeRangeName(selectedTimeRange ?? TimeRangeFilter.OneHour)}
                                <ArrowDownIcon
                                    className={classNames('ml-auto size-4', timeRangeExpanded ? 'rotate-180' : '')}
                                />
                            </div>
                            {timeRangeExpanded ? (
                                <div className="flex flex-col gap-0.5">
                                    {getEnumAsArray(TimeRangeFilter).map((timeRange) => (
                                        <div
                                            key={timeRange.value}
                                            className="hover:bg-bg flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg bg-clip-padding p-2"
                                            onClick={() => {
                                                onTimeRangeChange?.(timeRange.value);
                                                setTimeRangeExpanded(false);
                                            }}
                                        >
                                            {resolveTimeRangeName(timeRange.value)}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
            </PopoverPanel>
        </Popover>
    );
});
