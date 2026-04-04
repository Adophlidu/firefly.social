'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { createContext, useContext } from 'react';

import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { TipsModalRef } from '@/modals/TipsModal/refs.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export const OpenTipsModalContext = createContext<boolean>(false);

export function RootView() {
    const isMedium = useIsMedium();
    const router = useRouter();
    const open = useContext(OpenTipsModalContext);

    const { location } = useRouterState();
    const pathname = location.pathname;

    const { showLoadingView, showFailedView } = useTipsStore();

    const onBack = () => {
        router.history.back();
    };

    const onClose = () => {
        TipsModalRef.close();
    };

    const isListView = pathname === TipsRoutePath.SELECT_RECIPIENT || pathname === TipsRoutePath.SELECT_TOKEN;
    const content = (
        <div
            className={classNames('flex w-full flex-col transition-all', {
                'h-[292px]': pathname === TipsRoutePath.TIPS && showLoadingView,
                'h-[240px]': pathname === TipsRoutePath.TIPS && showFailedView,
                'h-[311px]': pathname === TipsRoutePath.TIPS && !showLoadingView && !showFailedView,
                'h-[424px]': pathname === TipsRoutePath.SUCCESS,
                'h-[382px] md:h-[512px]': isListView,
            })}
        >
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );

    if (isMedium) {
        return (
            <Modal
                title={<Trans>Tips</Trans>}
                size="md"
                enableClose={!isListView}
                enableBack={isListView}
                open={open}
                onBack={onBack}
                onClose={onClose}
                disableScrollLock={false}
                disableDialogClose={false}
            >
                <div className="bg-lightBottom text-medium text-lightMain dark:bg-darkBottom z-10 transition-all">
                    {content}
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!pt-10">
            <div className="text-medium text-lightMain px-3 pb-6">{content}</div>
        </Popover>
    );
}
