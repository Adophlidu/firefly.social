import { Outlet, useRouterState } from '@tanstack/react-router';

import { TipsModalHeader } from '@/components/Tips/TipsModalHeader.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { classNames } from '@/helpers/classNames.js';
import { TipsContext } from '@/hooks/useTipsContext.js';

export function RootView() {
    const { matches, location } = useRouterState();
    const { showLoadingView, showFailedView } = TipsContext.useContainer();

    const pathname = location.pathname;
    const contextTitle = [...matches].reverse().find((x) => x.context.title)?.context.title;
    const showBack = [TipsRoutePath.SELECT_RECIPIENT, TipsRoutePath.SELECT_TOKEN].includes(pathname as TipsRoutePath);
    const hideTitle = showLoadingView || showFailedView;

    return (
        <div
            className={classNames('flex w-full flex-col transition-all', {
                'h-[358px] md:h-[368px]':
                    [TipsRoutePath.TIPS, TipsRoutePath.SELECT_RECIPIENT, TipsRoutePath.NO_AVAILABLE_WALLET].includes(
                        pathname as TipsRoutePath,
                    ) && !hideTitle,
                'h-[292px]': pathname === TipsRoutePath.TIPS && showLoadingView,
                'h-[240px]': pathname === TipsRoutePath.TIPS && showFailedView,
                'h-[382px] md:h-[582px]': pathname === TipsRoutePath.SELECT_TOKEN,
                'h-[424px]': pathname === TipsRoutePath.SUCCESS,
            })}
        >
            {contextTitle && !hideTitle ? <TipsModalHeader back={showBack} title={contextTitle} /> : null}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
