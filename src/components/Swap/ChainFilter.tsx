import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import CheckIcon from '@/assets/check.svg';
import FilterIcon from '@/assets/filter.svg';
import MiniFilterIcon from '@/assets/mini-filter.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { captureChainFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { useSwapStateStore } from '@/store/useSwapStore.js';

interface ChainFilterProps {
    networkType?: NetworkType;
}

export function ChainFilter({ networkType }: ChainFilterProps) {
    const { selectedChainId, validChains, setSelectedChainId } = useSwapStateStore(networkType);

    const Icon = useMemo(() => {
        if (selectedChainId === 101) {
            return <ChainIcon chainId={101} networkType={NetworkType.Solana} size={20} />;
        } else if (selectedChainId === null) {
            return <FilterIcon width={24} height={24} />;
        } else {
            return <ChainIcon chainId={selectedChainId} size={20} />;
        }
    }, [selectedChainId]);
    return (
        <Menu>
            {({ close }) => (
                <div>
                    <MenuButton
                        className="size-6 text-placeholder outline-none"
                        onMouseEnter={(e) => e.currentTarget.click()}
                    >
                        {Icon}
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="bottom end"
                        className="z-50 origin-top-right !overflow-visible font-normal outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                        onMouseLeave={() => close()}
                    >
                        <div className="w-full -translate-y-5 transform pt-5">
                            <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom py-3 shadow-messageShadow">
                                <MenuItem key="all">
                                    <div
                                        className="flex w-full cursor-pointer items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                        onClick={() => {
                                            setSelectedChainId(null);
                                            close();
                                            captureChainFilterTabEvent('home');
                                        }}
                                    >
                                        {selectedChainId === null ? (
                                            <CheckIcon width={16} height={16} className="text-highlight" />
                                        ) : (
                                            <div className="size-4" />
                                        )}
                                        <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                            <MiniFilterIcon width={15} height={15} />
                                            <span>
                                                <Trans>All chains</Trans>
                                            </span>
                                        </div>
                                    </div>
                                </MenuItem>
                                {validChains.map(({ id, name, networkType }) => (
                                    <MenuItem key={id}>
                                        <div
                                            className="flex w-full cursor-pointer flex-row items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                            onClick={() => {
                                                setSelectedChainId(id);
                                                close();
                                                captureChainFilterTabEvent('home', `${id}`, name);
                                            }}
                                        >
                                            {selectedChainId === id ? (
                                                <CheckIcon width={16} height={16} className="text-highlight" />
                                            ) : (
                                                <div className="size-4" />
                                            )}
                                            <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                                <ChainIcon chainId={id} size={15} networkType={networkType} />
                                                <span>{name}</span>
                                            </div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </div>
                        </div>
                    </MenuItems>
                </div>
            )}
        </Menu>
    );
}
