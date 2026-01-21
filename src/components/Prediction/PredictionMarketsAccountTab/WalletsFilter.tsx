'use client';

import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { Fragment, memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';

interface WalletsFilterProps {
    wallets: Array<{
        wallet: string;
        proxy: string;
    }>;
    currentWallet: string;
    onChange: (newWallet: string) => void;
}

export const WalletsFilter = memo<WalletsFilterProps>(function WalletsFilter({ wallets, currentWallet, onChange }) {
    if (!wallets.length) return null;
    if (wallets.length === 1) {
        return <div className="text-sm font-semibold text-main">{formatAddressEthereum(wallets[0].proxy, 4)}</div>;
    }

    return (
        <Popover as="div" className="relative">
            {({ close }) => (
                <>
                    <PopoverButton className="flex h-9 min-w-32 cursor-pointer items-center justify-between gap-1 rounded-md border border-secondaryLine bg-bottom px-2 text-sm font-semibold text-main focus:outline-none">
                        <span>{formatAddressEthereum(currentWallet, 4)}</span>
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
                            style={{ height: 38 * wallets.length + 32 + 40 }}
                            className="no-scrollbar absolute bottom-full right-0 z-30 w-[380px] !max-w-[90vw] -translate-y-3 rounded-lg bg-lightBottom py-4 text-medium shadow-popover [--anchor-max-height:224px] dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                        >
                            <h1 className="h-7 px-4 text-lg font-bold text-main">
                                <Trans>Wallets</Trans>
                            </h1>
                            <div className="mt-2 space-y-1">
                                {wallets.map((wallet) => {
                                    const isSelected = isSameEthereumAddress(wallet.proxy, currentWallet);

                                    return (
                                        <ClickableButton
                                            key={wallet.proxy}
                                            className={classNames(
                                                'flex h-[34px] w-full items-center gap-3 truncate px-4 transition duration-150 ease-in hover:bg-lightBg',
                                                isSelected ? 'bg-lightBg font-semibold' : '',
                                            )}
                                            onClick={() => {
                                                onChange(wallet.proxy);
                                                close();
                                            }}
                                        >
                                            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-main">
                                                {wallet.proxy}
                                            </span>
                                        </ClickableButton>
                                    );
                                })}
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
});
