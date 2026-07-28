import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { Comeback } from '@/components/Comeback.js';

/** Renders its own header — suppress the (normal) frame's NavigatorBar. */
export const topnav = () => null;

export default function PostDetailLayout({ children }: { children?: ReactNode }) {
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
