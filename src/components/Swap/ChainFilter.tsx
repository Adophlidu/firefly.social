import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

import AllChainIcon from '@/assets/all-chains.svg';
import CheckIcon from '@/assets/check.svg';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { useSwapStore } from '@/store/useSwapStore.js';

const chains = [mainnet, optimism, bsc, polygon, arbitrum, base];

export function ChainFilter() {
    const { selectedChainId, setSelectedChainId } = useSwapStore();

    const Icon = useMemo(() => {
        if (selectedChainId === 101) {
            return <ChainIcon chainId={101} networkType={NetworkType.Solana} size={20} />;
        } else if (selectedChainId === null) {
            return <AllChainIcon width={20} height={20} />;
        } else {
            return <ChainIcon chainId={selectedChainId} size={20} />;
        }
    }, [selectedChainId]);
    return (
        <Menu>
            {({ close }) => (
                <>
                    <MenuButton
                        className="size-5 text-placeholder outline-none"
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
                                        }}
                                    >
                                        {selectedChainId === null ? (
                                            <CheckIcon width={16} height={16} className="text-highlight" />
                                        ) : (
                                            <div className="size-4" />
                                        )}
                                        <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                            <AllChainIcon width={15} height={15} />
                                            <span>
                                                <Trans>All chains</Trans>
                                            </span>
                                        </div>
                                    </div>
                                </MenuItem>
                                <MenuItem key="solana">
                                    <div
                                        className="flex w-full cursor-pointer items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                        onClick={() => {
                                            setSelectedChainId(101);
                                            close();
                                        }}
                                    >
                                        {selectedChainId === 101 ? (
                                            <CheckIcon width={16} height={16} className="text-highlight" />
                                        ) : (
                                            <div className="size-4" />
                                        )}
                                        <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                            <ChainIcon chainId={101} networkType={NetworkType.Solana} size={15} />
                                            <span>Solana</span>
                                        </div>
                                    </div>
                                </MenuItem>
                                {chains.map((chain) => (
                                    <MenuItem key={chain.id}>
                                        <div
                                            className="flex w-full cursor-pointer flex-row items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                            onClick={() => {
                                                setSelectedChainId(chain.id);
                                                close();
                                            }}
                                        >
                                            {selectedChainId === chain.id ? (
                                                <CheckIcon width={16} height={16} className="text-highlight" />
                                            ) : (
                                                <div className="size-4" />
                                            )}
                                            <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                                <ChainIcon chainId={chain.id} size={15} />
                                                <span>{chain.name}</span>
                                            </div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </div>
                        </div>
                    </MenuItems>
                </>
            )}
        </Menu>
    );
}
