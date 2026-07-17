'use client';

import CheckIcon from '@dimensiondev/assets/check.svg';
import FilterIcon from '@dimensiondev/assets/filter.svg';
import { MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import type { TradeRecord } from '@/types/token.js';

interface Props {
    value: TradeRecord['type'] | undefined;
    onChange: (value: TradeRecord['type'] | undefined) => void;
}

const options = [
    {
        id: 'all',
        value: undefined,
        label: <Trans>All</Trans>,
    },
    {
        id: 'buy',
        value: 'buy',
        label: <Trans>Buy</Trans>,
    },
    {
        id: 'sell',
        value: 'sell',
        label: <Trans>Sell</Trans>,
    },
] as const;

export function TradeFilter({ value, onChange }: Props) {
    return (
        <MoreActionMenu
            loginRequired={false}
            useTransition={false}
            renderMenu={({ close }) => (
                <div>
                    <MenuButton
                        className="size-5 text-placeholder outline-none"
                        onMouseEnter={(e) => e.currentTarget.click()}
                    >
                        <FilterIcon width={20} height={20} />
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="bottom end"
                        className="z-50 origin-top-right !overflow-visible font-normal outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                        onMouseLeave={() => close()}
                    >
                        <div className="flex translate-y-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-primaryBottom p-3 shadow-messageShadow">
                            {options.map((option) => (
                                <MenuItem key={option.id}>
                                    {({ close: itemClose }) => (
                                        <div
                                            className="box-border flex min-w-[235px] cursor-pointer flex-row items-center rounded-lg bg-clip-padding p-2 font-inter text-sm text-main hover:bg-bg"
                                            onClick={() => {
                                                onChange(option.value);
                                                itemClose();
                                            }}
                                        >
                                            {option.label}
                                            {value === option.value ? (
                                                <CheckIcon width={16} height={16} className="ml-auto text-highlight" />
                                            ) : null}
                                        </div>
                                    )}
                                </MenuItem>
                            ))}
                        </div>
                    </MenuItems>
                </div>
            )}
        />
    );
}
