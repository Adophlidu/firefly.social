'use client';

import { Checkbox, Menu } from '@headlessui/react';

import FilterIcon from '@/assets/filter.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

export function DiscoverFilter() {
    const { filteredPlatforms, setFilteredPlatform } = useDiscoverStore();
    return (
        <Menu>
            <Menu.Button className="h-5 w-5 text-placeholder">
                <FilterIcon width={20} height={20} />
            </Menu.Button>
            <Menu.Items
                transition
                anchor="bottom end"
                className="z-50 flex w-[192px] origin-top-right flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom p-3 font-normal shadow-messageShadow transition data-[closed]:scale-95 data-[closed]:opacity-0"
            >
                <div className="flex w-full justify-between py-1">
                    <span className="text-sm font-bold">Platform filter</span>
                </div>
                {SOCIAL_DISCOVER_SOURCE.map((source) => {
                    const checked = filteredPlatforms.includes(source);
                    return (
                        <div
                            key={source}
                            className={classNames('flex w-full flex-row items-center justify-between py-1', {
                                'text-placeholder': checked,
                            })}
                        >
                            <div className="flex h-[22px] flex-row items-center text-medium">
                                <SocialSourceIcon
                                    source={source}
                                    width={15}
                                    height={15}
                                    className="mr-2 shrink-0"
                                    mono
                                />
                                {resolveSourceName(source)}
                            </div>
                            <Checkbox
                                onChange={(checked) => setFilteredPlatform(source, !checked)}
                                checked={checked}
                                className="cursor-pointer"
                            >
                                <CircleCheckboxIcon checked={!checked} />
                            </Checkbox>
                        </div>
                    );
                })}
            </Menu.Items>
        </Menu>
    );
}
