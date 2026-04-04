'use client';

import SuspendedSVG from '@dimensiondev/assets/suspended.svg';
import { Trans } from '@lingui/react/macro';
import { useLayoutEffect } from 'react';

import { useBodyLock } from '@/hooks/useBodyLock.js';

export function SuspendedAccountFallback() {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    useBodyLock(true);

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-start pt-10">
            <div className="flex w-full flex-col items-center justify-center space-y-10 px-4 text-center">
                <SuspendedSVG className="text-third h-auto w-full max-w-[310px]" />
                <h3 className="text-second text-lg font-bold">
                    <Trans>Suspended</Trans>
                </h3>
                <p className="text-second text-base">
                    <Trans>The content of this account is currently unavailable</Trans>
                </p>
            </div>
        </div>
    );
}
