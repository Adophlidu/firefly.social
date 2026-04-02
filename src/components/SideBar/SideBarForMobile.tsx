'use client';

import DarkLogo from '@dimensiondev/assets/logo.dark.svg';
import LightLogo from '@dimensiondev/assets/logo.light.svg';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, memo } from 'react';

import { CloseButton } from '@/components/IconButton.js';
import { Menu } from '@/components/SideBar/Menu.js';
import { useDisableScrollPassive } from '@/hooks/useDisableScrollPassive.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

export const SideBarForMobile = memo(function SideBarForMobile() {
    const { setRef } = useDisableScrollPassive();
    const isDarkMode = useIsDarkMode();

    const { sidebarOpen, updateSidebarOpen } = useNavigatorState();

    return (
        <Transition.Root show={sidebarOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50 md:hidden"
                onClose={() => updateSidebarOpen(false)}
                disableScrollLock
            >
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-main/25 bg-opacity-30" />
                </Transition.Child>

                <div
                    className="fixed inset-0 flex"
                    ref={(ref) => {
                        setRef(ref);
                    }}
                >
                    <Dialog.Panel className="relative mr-16 flex w-full max-w-[280px] flex-1">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <div className="relative z-50 flex w-[280px] flex-col bg-white dark:bg-black">
                                <div className="flex grow flex-col gap-y-4 border-r border-line px-3">
                                    <div className="-ml-2 flex h-16 shrink-0 items-center">
                                        {isDarkMode ? (
                                            <DarkLogo width={169} height={80} />
                                        ) : (
                                            <LightLogo width={169} height={80} />
                                        )}
                                    </div>
                                    <Menu />
                                </div>
                                <div className="absolute right-0 top-0 z-50 flex w-16 justify-center pt-4">
                                    <CloseButton className="-m-2.5 p-2.5" onClick={() => updateSidebarOpen(false)} />
                                </div>
                            </div>
                        </Transition.Child>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition.Root>
    );
});
