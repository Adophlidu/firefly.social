import HistoryIcon from '@dimensiondev/assets/history.svg';
import QuestionIcon from '@dimensiondev/assets/question.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Outlet, useLocation, useRouter, useRouterState } from '@tanstack/react-router';

import { BackButton, CloseButton } from '@/components/IconButton.js';
import { RedPacketProvider } from '@/modals/RedPacketModal/RedPacketContext.js';
import { RedPacketModalRef } from '@/modals/RedPacketModal/refs.js';

export function RootView() {
    const router = useRouter();
    const { matches, location } = useRouterState();

    const isMain = location.pathname === '/main';
    const isFinalView = !!useLocation().search._FINAL_VIEW_;
    const isRequirements = location.pathname === '/requirements';

    const contextTitle = [...matches].find((x) => x.context.title)?.context.title;

    const title = contextTitle ?? <Trans>Lucky Drop</Trans>;

    return (
        <RedPacketProvider>
            <div
                className={classNames(
                    'bg-primaryBottom flex transform-gpu flex-col overflow-hidden rounded-xl transition-all',
                    location.pathname === '/requirement-rules'
                        ? 'min-h-[400px] min-w-[400px]'
                        : 'min-h-[620px] min-w-[600px]',
                )}
            >
                <div className="flex items-center justify-center gap-2 rounded-t-xl p-4">
                    {isMain || isFinalView ? (
                        <CloseButton
                            className="!p-0"
                            onClick={() => {
                                RedPacketModalRef.close();
                            }}
                        />
                    ) : (
                        <BackButton
                            onClick={() => {
                                router.history.back();
                            }}
                        />
                    )}

                    <div className="text-main shrink grow basis-0 text-center text-lg font-bold leading-snug">
                        {title}
                    </div>
                    <div className="relative size-6">
                        {isMain ? (
                            <HistoryIcon className="cursor-pointer" onClick={() => router.history.push('/history')} />
                        ) : isRequirements ? (
                            <QuestionIcon
                                className="size-6 cursor-pointer"
                                onClick={() => router.history.push('/requirement-rules')}
                            />
                        ) : null}
                    </div>
                </div>
                <Outlet />
            </div>
        </RedPacketProvider>
    );
}
