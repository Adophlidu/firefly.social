'use client';

import { memo } from 'react';

export const SportRecommendationsSkeleton = memo(function SportRecommendationsSkeleton() {
    return (
        <section className="mt-4 flex animate-pulse flex-col gap-4">
            <div className="flex items-center justify-between px-3">
                <div className="h-6 w-28 rounded bg-bg" />
                <div className="h-5 w-12 rounded bg-bg" />
            </div>
            <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                    <div
                        key={i}
                        className="flex min-h-[104px] items-center gap-3 rounded-lg border border-line bg-primaryBottom p-4"
                    >
                        <div className="flex w-12 shrink-0 flex-col items-center gap-2">
                            <div className="size-12 rounded-lg bg-bg" />
                            <div className="h-4 w-10 rounded bg-bg" />
                        </div>
                        <div className="flex flex-1 flex-col items-center gap-2">
                            <div className="h-5 w-16 rounded bg-bg" />
                            <div className="h-4 w-12 rounded bg-bg" />
                        </div>
                        <div className="flex w-12 shrink-0 flex-col items-center gap-2">
                            <div className="size-12 rounded-lg bg-bg" />
                            <div className="h-4 w-10 rounded bg-bg" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
});
