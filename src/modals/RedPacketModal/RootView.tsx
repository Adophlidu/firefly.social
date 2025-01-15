import { Trans } from '@lingui/react/macro';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useContext } from 'react';

import HistoryIcon from '@/assets/history.svg';
import { BackButton } from '@/components/BackButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { NetworkType } from '@/constants/enum.js';
import { RedPacketModalRef } from '@/modals/controls.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';

export function RootView() {
    const router = useRouter();
    const { matches, location } = useRouterState();
    const { networkType } = useContext(RedPacketContext);

    const isMain = location.pathname === '/main';

    const contextTitle = [...matches].find((x) => x.context.title)?.context.title;

    const title = contextTitle ?? <Trans>Lucky Drop</Trans>;

    return (
        <div className="flex min-h-[620px] min-w-[600px] transform flex-col overflow-hidden rounded-[12px] bg-primaryBottom transition-all">
            <div className="flex items-center justify-center gap-2 rounded-t-[12px] p-4">
                {isMain ? (
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
                    {isMain && networkType === NetworkType.Ethereum ? (
                        <HistoryIcon className="cursor-pointer" onClick={() => router.history.push('/history')} />
                    ) : null}
                </div>
            </div>
            <Outlet />
        </div>
    );
}
