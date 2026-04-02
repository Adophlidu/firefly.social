'use client';

import { Trans } from '@lingui/react/macro';

import MenuIcon from '@/assets/menu.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

export function SettingsHeader() {
    const { updateSidebarOpen } = useNavigatorState();
    const pathname = usePathname();

    if (pathname !== PageRoute.Settings) return null;
    return (
        <header className="hidden w-full items-center gap-4 px-6 py-3 text-main max-md:flex">
            <div className="flex size-[30px] shrink-0 justify-center">
                <ClickableButton
                    className="flex items-center justify-center"
                    onClick={() => {
                        updateSidebarOpen(true);
                    }}
                >
                    <MenuIcon />
                </ClickableButton>
            </div>
            <h1 className="flex h-10 flex-1 items-center justify-center">
                <span className="text-[18px] font-bold leading-6">
                    <Trans>Settings</Trans>
                </span>
            </h1>
            <div className="flex size-[30px]" />
        </header>
    );
}
