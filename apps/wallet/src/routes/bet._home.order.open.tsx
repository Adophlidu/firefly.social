import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

function SkeletonLine({ className }: { className: string }) {
    return <div className={`bg-lightBg animate-pulse rounded ${className}`} />;
}

function OpenOrdersSkeleton() {
    return (
        <div className="w-full pt-4">
            {Array.from({ length: 1 }).map((_, index) => (
                <div key={index} className="w-full space-y-3 p-4">
                    <div className="flex w-full items-center gap-2">
                        <SkeletonLine className="size-6 rounded-md" />
                        <SkeletonLine className="h-4 w-3/4" />
                    </div>

                    <div className="w-full space-y-2">
                        <div className="grid w-full grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <SkeletonLine className="h-5 w-24" />
                                <SkeletonLine className="h-4 w-16" />
                            </div>
                            <div className="space-y-2">
                                <SkeletonLine className="h-5 w-20" />
                                <SkeletonLine className="h-4 w-14" />
                            </div>
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <SkeletonLine className="h-5 w-16" />
                                <SkeletonLine className="h-4 w-14" />
                            </div>
                            <div className="space-y-2">
                                <SkeletonLine className="h-5 w-28" />
                                <SkeletonLine className="h-4 w-16" />
                            </div>
                        </div>
                    </div>

                    <SkeletonLine className="h-10 w-full rounded-[10px]" />
                </div>
            ))}
        </div>
    );
}

const OpenOrders = lazy(() => import('@/components/Bet/OpenOrders.js').then((m) => ({ default: m.OpenOrders })));

export const Route = createFileRoute('/bet/_home/order/open')({
    component: OpenOrdersPage,
    pendingComponent: OpenOrdersSkeleton,
});

function OpenOrdersPage() {
    return (
        <Suspense fallback={<OpenOrdersSkeleton />}>
            <OpenOrders />
        </Suspense>
    );
}
