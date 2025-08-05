'use client';

import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import ComeBack from '@/assets/comeback.svg';
import { useComeBack } from '@/hooks/useComeback.js';

export default function Layout({ children }: PropsWithChildren) {
    const comeback = useComeBack();
    return (
        <>
            <div className="sticky top-0 z-40 flex items-center bg-primaryBottom px-4 pb-3 pt-6">
                <ComeBack width={24} height={24} className="mr-2 cursor-pointer" onClick={comeback} />
                <h2 className="min-w-0 truncate text-xl font-black leading-6">
                    <Trans>Firefly Wallet</Trans>
                </h2>
            </div>
            {children}
        </>
    );
}
