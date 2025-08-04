'use client';

import { Trans } from '@lingui/react/macro';

import { Comeback } from '@/components/Comeback.js';

export default function LoadingPage() {
    return (
        <>
            <header className="sticky top-0 z-40 flex items-center border-b border-line bg-primaryBottom px-4 py-[18px]">
                <Comeback className="mr-8" />
                <h2 className="text-xl font-black leading-6">
                    <Trans>Details</Trans>
                </h2>
            </header>
            <div className="animate-pulse border-b-0 px-3 py-2 md:px-4 md:py-3">
                <div className="grid grid-cols-[40px_1fr] gap-3">
                    <div className="size-10 rounded-full bg-bg" />
                    <div>
                        <div className="h-3 w-full max-w-28 rounded bg-bg" />
                        <div className="mt-4 h-3 w-full max-w-20 rounded bg-bg" />
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    <div className="h-3 w-full rounded bg-bg" />
                    <div className="h-3 w-full rounded bg-bg" />
                    <div className="h-3 w-3/4 rounded bg-bg" />
                    <div className="aspect-square w-full rounded-lg bg-bg" />
                </div>
            </div>
        </>
    );
}
