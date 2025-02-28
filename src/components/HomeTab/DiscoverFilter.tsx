'use client';

import { Checkbox, Menu, Switch } from '@headlessui/react';

import FilterIcon from '@/assets/filter.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

export function DiscoverFilter() {
    const { enabledFilterPlatform, filteredPlatforms, setFilteredPlatform, setEnabledFilteredPlatform } =
        useDiscoverStore();
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
                    <Switch
                        checked={enabledFilterPlatform}
                        onChange={setEnabledFilteredPlatform}
                        className="group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-lightHighlight dark:bg-bg data-[checked]:dark:bg-lightHighlight"
                    >
                        <span className="flex size-4 translate-x-1 items-center justify-center rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                    </Switch>
                </div>
                {SOCIAL_DISCOVER_SOURCE.map((source) => {
                    const checked = filteredPlatforms.includes(source);
                    return (
                        <div key={source} className="flex w-full flex-row items-center justify-between py-1">
                            <div className="flex h-[22px] flex-row items-center">
                                <SocialSourceIcon
                                    source={source}
                                    width={15}
                                    height={15}
                                    className="mr-2 shrink-0 text-placeholder"
                                    mono
                                />
                                {source}
                            </div>
                            <Checkbox
                                onChange={(checked) => setFilteredPlatform(source, !checked)}
                                checked={checked}
                                className="cursor-pointer"
                            >
                                <CircleCheckboxIcon checked={checked} />
                            </Checkbox>
                        </div>
                    );
                })}
            </Menu.Items>
        </Menu>
    );
}
