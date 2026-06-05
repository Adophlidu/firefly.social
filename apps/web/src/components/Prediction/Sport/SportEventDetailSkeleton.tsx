'use client';

import { memo } from 'react';

export const SportEventDetailSkeleton = memo(function SportEventDetailSkeleton() {
    return (
        <div className="animate-pulse pb-20">
            {/* Sticky header bar */}
            <div className="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-line bg-primaryBottom px-4 md:h-[60px]">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="size-6 rounded bg-bg" />
                    <div className="h-5 w-48 rounded bg-bg md:h-6 md:w-64" />
                </div>
            </div>

            {/* Event overview / team data section skeleton */}
            <div className="flex items-start gap-4 p-4">
                <div className="size-[52px] shrink-0 rounded bg-bg" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="h-5 w-3/4 rounded bg-bg" />
                    <div className="mt-1 flex items-center gap-1.5">
                        <div className="size-5 rounded-full bg-bg" />
                        <div className="h-5 w-14 rounded-full bg-bg" />
                        <div className="h-4 w-32 rounded bg-bg" />
                    </div>
                </div>
            </div>

            {/* Chart skeleton */}
            <div className="mx-4 h-[232px] rounded-lg bg-bg" />

            {/* Markets skeleton */}
            <div className="mx-4 mt-4 flex flex-col gap-3">
                <div className="h-10 rounded-lg bg-bg" />
                <div className="h-24 rounded-lg bg-bg" />
            </div>

            {/* Tabs skeleton */}
            <div className="mx-4 mt-6 flex gap-4">
                <div className="h-8 w-20 rounded bg-bg" />
                <div className="h-8 w-20 rounded bg-bg" />
            </div>

            {/* Tab content skeleton */}
            <div className="mx-4 mt-4 flex flex-col gap-3">
                <div className="h-4 w-3/4 rounded bg-bg" />
                <div className="h-4 w-1/2 rounded bg-bg" />
                <div className="h-4 w-2/3 rounded bg-bg" />
            </div>
        </div>
    );
});
