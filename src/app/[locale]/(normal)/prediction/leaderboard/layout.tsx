'use client';

import { Trans } from '@lingui/react/macro';

import { Comeback } from '@/components/Comeback.js';
import { type LayoutProps } from '@/types/utility.js';

export default function BetsLeaderboardLayout(props: LayoutProps) {
    return (
        <div>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black text-lightMain">
                        <Trans>Leaderboard</Trans>
                    </span>
                </div>
            </div>
            <div className="flex grow flex-col">{props.children}</div>
        </div>
    );
}
