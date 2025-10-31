'use client';

import { classNames } from '@firefly/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { cloneElement, type HTMLProps, type ReactElement, type ReactNode, useMemo } from 'react';

import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import CheckIcon from '@/assets/check.svg';

export interface FireflyWalletChainSelectorProps<C extends string = string> {
    chains: Array<{ value: C; label: ReactNode; icon: ReactElement<HTMLProps<'svg'>> }>;
    selectedChain: C;
    onSelectChain: (value: C) => void;
}

export function FireflyWalletChainSelector<C extends string = string>({
    chains,
    selectedChain,
    onSelectChain,
}: FireflyWalletChainSelectorProps<C>) {
    const chain = useMemo(() => chains.find(({ value }) => value === selectedChain), [selectedChain, chains]);

    return (
        <Menu>
            <MenuButton
                className={classNames('inline-flex h-8 items-center rounded-full bg-bg px-2 text-[13px] font-medium')}
            >
                {({ open }) => (
                    <>
                        {chain?.icon
                            ? cloneElement(chain?.icon, { width: 15, height: 15, className: 'shrink-0 mr-2' })
                            : null}
                        <span className="mr-1">{chain?.label}</span>
                        <ArrowDownIcon
                            width={12}
                            height={12}
                            className={classNames('shrink-0 text-second duration-100', {
                                'rotate-180': open,
                            })}
                        />
                    </>
                )}
            </MenuButton>
            <MenuItems
                transition
                anchor="bottom end"
                className="z-50 w-[130px] origin-top-left !overflow-visible text-xs outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
            >
                <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom py-3 shadow-messageShadow">
                    {chains.map(({ value, label, icon }) => {
                        return (
                            <MenuItem key={value}>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectChain(value)}
                                    className="flex cursor-pointer items-center px-3 py-1 hover:bg-bg"
                                >
                                    <div
                                        className={classNames('mr-2 size-[15px] shrink-0 text-highlight', {
                                            'opacity-0': value !== selectedChain,
                                        })}
                                    >
                                        <CheckIcon width={15} height={15} />
                                    </div>
                                    {icon
                                        ? cloneElement(icon, {
                                              width: 15,
                                              height: 15,
                                              className: 'shrink-0 mr-1',
                                          })
                                        : null}
                                    <div>{label}</div>
                                </div>
                            </MenuItem>
                        );
                    })}
                </div>
            </MenuItems>
        </Menu>
    );
}
