'use client';

import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { Comeback } from '@/components/Comeback.js';

export default function Layout({ children }: PropsWithChildren) {
    return (
        <>
            <header className="sticky top-0 z-40 flex items-center border-b border-line bg-primaryBottom px-4 py-[18px]">
                <Comeback className="mr-8" />
                <h2 className="text-xl font-black leading-6">
                    <Trans>Details</Trans>
                </h2>
            </header>
            {children}
        </>
    );
}
