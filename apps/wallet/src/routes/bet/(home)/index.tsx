import { useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';

import { BetError } from '@/components/Bet/BetError.js';
import { SettleResolvedMarketsSection } from '@/components/Bet/SettleResolvedMarketsSection.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';

function SkeletonLine({ className }: { className: string }) {
    return <div className={`animate-pulse rounded bg-lightBg ${className}`} />;
}

function PositionsSkeleton() {
    return (
        <div className="w-full">
            <div className="px-4 pb-3 pt-4">
                <div className="w-full space-y-3 rounded-xl p-3">
                    <div className="grid h-10 grid-cols-[40px_1fr] grid-rows-[40px] gap-2">
                        <SkeletonLine className="size-10 rounded-lg" />
                        <div className="space-y-2 pt-1">
                            <SkeletonLine className="h-4 w-4/5" />
                            <SkeletonLine className="h-4 w-2/3" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="space-y-2">
                            <SkeletonLine className="h-5 w-24" />
                            <SkeletonLine className="h-3.5 w-16" />
                        </div>
                        <div className="space-y-2">
                            <SkeletonLine className="h-5 w-24" />
                            <SkeletonLine className="h-3.5 w-20" />
                        </div>
                        <div className="space-y-2">
                            <SkeletonLine className="h-5 w-16" />
                            <SkeletonLine className="h-3.5 w-14" />
                        </div>
                        <div className="space-y-2">
                            <SkeletonLine className="h-5 w-16" />
                            <SkeletonLine className="h-3.5 w-16" />
                        </div>
                    </div>

                    <SkeletonLine className="h-12 w-full rounded-full" />
                </div>
            </div>
        </div>
    );
}

const Positions = lazy(() => import('@/components/Bet/Positions.js').then((m) => ({ default: m.Positions })));

export default BetHomePage;
function SettleSection() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const address = account?.proxyAddress;
    if (!address) return null;
    return (
        <div className="px-4 pb-3 pt-4 empty:hidden">
            <SettleResolvedMarketsSection proxyAddress={address} key={address} />
        </div>
    );
}

export function BetHomePage() {
    return (
        <div className="w-full">
            <Suspense fallback={null}>
                <SettleSection />
            </Suspense>
            <Suspense fallback={<PositionsSkeleton />}>
                <Positions />
            </Suspense>
        </div>
    );
}
