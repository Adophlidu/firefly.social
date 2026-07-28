import { useSearch } from '@dimensiondev/ssr';
import { useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { z } from 'zod';

import { parseSearchParams } from '@/helpers/searchParams.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';

function SkeletonLine({ className }: { className: string }) {
    return <div className={`animate-pulse rounded bg-lightBg ${className}`} />;
}

function HistorySkeleton() {
    return (
        <div className="mb-8 w-full">
            {Array.from({ length: 1 }).map((_, index) => (
                <div key={index} className="w-full px-4 pt-4">
                    <div className="w-full rounded-xl p-3">
                        <div className="grid grid-cols-[40px_1fr] gap-2">
                            <SkeletonLine className="size-10 rounded-lg" />
                            <div className="space-y-2 pt-1">
                                <SkeletonLine className="h-4 w-4/5" />
                                <SkeletonLine className="h-4 w-2/3" />
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between gap-6">
                                <SkeletonLine className="h-5 w-20" />
                                <SkeletonLine className="h-5 w-24" />
                            </div>
                            <div className="flex items-center justify-between gap-6">
                                <SkeletonLine className="h-[14px] w-16" />
                                <SkeletonLine className="h-[14px] w-20" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

const History = lazy(() => import('@/components/Bet/History.js').then((m) => ({ default: m.History })));

const historySearchSchema = z
    .object({
        tab: z.enum(['closed-positions', 'trading-activities']).optional(),
    })
    .passthrough();

export default HistoryPage;

function HistoryPage() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { tab } = historySearchSchema.parse(parseSearchParams(useSearch()));

    useEffect(() => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_RECENT_ACTIVITY_OPEN_SUCCESS, {
            proxy_wallet_address: account?.proxyAddress ?? '',
        });
    }, [account?.proxyAddress]);

    return (
        <Suspense fallback={<HistorySkeleton />}>
            <History initialTab={tab} />
        </Suspense>
    );
}
