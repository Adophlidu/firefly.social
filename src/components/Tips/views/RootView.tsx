import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Outlet, useRouterState } from '@tanstack/react-router';

import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { TipsModalRef } from '@/modals/TipsModal/index.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export function RootView() {
    const isMedium = useIsMedium();

    const { location } = useRouterState();
    const pathname = location.pathname;

    const { open, showLoadingView, showFailedView } = useTipsStore();

    const onBack = () => {
        router.history.back();
    };

    const onClose = () => {
        TipsModalRef.close();
    };

    const content = (
        <div
            className={classNames('flex w-full flex-col transition-all', {
                'h-[292px]': pathname === TipsRoutePath.TIPS && showLoadingView,
                'h-[240px]': pathname === TipsRoutePath.TIPS && showFailedView,
                'h-[382px] md:h-[582px]': pathname === TipsRoutePath.SELECT_TOKEN,
                'h-[424px]': pathname === TipsRoutePath.SUCCESS,
            })}
        >
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );

    if (isMedium) {
        const enableBack = pathname === TipsRoutePath.SELECT_RECIPIENT || pathname === TipsRoutePath.SELECT_TOKEN;

        return (
            <Modal
                title={<Trans>Tips</Trans>}
                size="md"
                enableClose={!enableBack}
                enableBack={enableBack}
                open={open}
                onBack={onBack}
                onClose={onClose}
                disableScrollLock={false}
                disableDialogClose={false}
            >
                <div className="z-10 bg-lightBottom text-medium text-lightMain transition-all dark:bg-darkBottom">
                    {content}
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!pt-10">
            <div className="px-3 pb-6 text-medium text-lightMain">{content}</div>
        </Popover>
    );
}
