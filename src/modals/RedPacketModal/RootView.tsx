import { Trans } from '@lingui/react/macro';
import { Outlet, useLocation, useRouter, useRouterState } from '@tanstack/react-router';

import HistoryIcon from '@/assets/history.svg';
import QuestionIcon from '@/assets/question.svg';
import { BackButton } from '@/components/BackButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { classNames } from '@/helpers/classNames.js';
import { RedPacketModalRef } from '@/modals/controls.js';

export function RootView() {
    const router = useRouter();
    const { matches, location } = useRouterState();

    const isMain = location.pathname === '/main';
    const isFinalView = !!useLocation().search._FINAL_VIEW_;
    const isRequirements = location.pathname === '/requirements';

    const contextTitle = [...matches].find((x) => x.context.title)?.context.title;

    const title = contextTitle ?? <Trans>Lucky Drop</Trans>;

    return (
        <div
            className={classNames(
                'flex transform flex-col overflow-hidden rounded-[12px] bg-primaryBottom transition-all',
                location.pathname === '/requirement-rules'
                    ? 'min-h-[400px] min-w-[400px]'
                    : 'min-h-[620px] min-w-[600px]',
            )}
        >
            <div className="flex items-center justify-center gap-2 rounded-t-[12px] p-4">
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

                <div className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">{title}</div>
                <div className="relative h-6 w-6">
                    {isMain ? (
                        <HistoryIcon className="cursor-pointer" onClick={() => router.history.push('/history')} />
                    ) : isRequirements ? (
                        <QuestionIcon
                            className="h-6 w-6 cursor-pointer"
                            onClick={() => router.history.push('/requirement-rules')}
                        />
                    ) : null}
                </div>
            </div>
            <Outlet />
        </div>
    );
}
