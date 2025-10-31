import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useMemo, useState } from 'react';

import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import CheckIcon from '@/assets/check.svg';
import EvmChainsIcon from '@/assets/evm-chains.svg';
import FilterIcon from '@/assets/filter.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { captureChainFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

interface ChainFilterProps {
    networkType?: NetworkType;
    children?: ReactNode;
}

export const ChainFilter = memo(function ChainFilter({ networkType, children }: ChainFilterProps) {
    const { selectedChainId, validChains, setSelectedChainId } = useTransactionsStateStore(networkType);
    const [expanded, setExpanded] = useState(false);

    const Icon = useMemo(() => {
        if (selectedChainId === 101) {
            return <ChainIcon chainId={101} networkType={NetworkType.Solana} size={20} />;
        } else if (selectedChainId === null) {
            return <FilterIcon width={24} height={24} />;
        }
        return <ChainIcon chainId={selectedChainId} size={20} />;
    }, [selectedChainId]);

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">{Icon}</PopoverButton>
            <PopoverPanel
                className="absolute right-0 top-10 z-50 flex min-w-[320px] flex-col gap-2 rounded-lg bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom"
                transition
            >
                <div className="flex flex-col gap-4 p-4">
                    <div className="text-sm font-normal text-second">
                        <Trans>Chain filter</Trans>
                    </div>
                    <div
                        className="flex h-[30px] cursor-pointer items-center rounded-lg bg-bg px-3 py-[7px]"
                        onClick={() => {
                            setExpanded(!expanded);
                        }}
                    >
                        {selectedChainId ? (
                            <div className="flex items-center gap-2 text-sm font-normal text-main">
                                <ChainIcon chainId={selectedChainId} size={15} networkType={networkType} />
                                {validChains.find(({ id }) => id === selectedChainId)?.name}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm font-normal text-main">
                                <EvmChainsIcon className="size-[18px]" />
                                <Trans>All Chains</Trans>
                            </div>
                        )}

                        <ArrowDownIcon className={classNames('ml-auto size-4', expanded ? 'rotate-180' : '')} />
                    </div>
                    {expanded ? (
                        <div className="flex flex-col gap-0.5">
                            <div
                                className="flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg bg-clip-padding p-2 hover:bg-bg"
                                onClick={() => {
                                    setSelectedChainId(null);
                                    setExpanded(false);
                                }}
                            >
                                <div className="flex h-[20px] items-center gap-2 text-sm font-normal text-main">
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
                            {validChains.map(({ id, name, networkType }) => (
                                <div
                                    key={id}
                                    className="flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg bg-clip-padding p-2 hover:bg-bg"
                                    onClick={() => {
                                        setSelectedChainId(id);
                                        setExpanded(false);
                                        captureChainFilterTabEvent('home', `${id}`, name);
                                    }}
                                >
                                    <div className="flex h-[20px] items-center gap-2 text-sm font-normal text-main">
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
                    {children}
                </div>
            </PopoverPanel>
        </Popover>
    );
});
