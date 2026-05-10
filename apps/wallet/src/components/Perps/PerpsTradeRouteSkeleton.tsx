import { type CSSProperties, memo } from 'react';

/** Mirrors `packages/rn-ui/src/skeletons/PerpsTradeDetailSkeleton.tsx` for lazy-route fallback only. */
function Block({ className = '', style }: { className?: string; style?: CSSProperties }) {
    return <div className={`shrink-0 rounded-lg bg-[#EDEEF2] ${className}`} style={style} aria-hidden />;
}

function SkeletonPositionCard() {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-[#F0F0F0] p-3">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                    <Block className="h-3.5 w-[60px] rounded-md" />
                    <Block className="h-3.5 w-20 rounded-md" />
                </div>
                <div className="flex justify-between">
                    <div className="flex gap-1">
                        <Block className="h-[18px] w-8 rounded-[10px]" />
                        <Block className="h-[18px] w-12 rounded-[10px]" />
                        <Block className="h-[18px] w-6 rounded-[10px]" />
                    </div>
                    <Block className="h-3.5 w-[120px] rounded-md" />
                </div>
            </div>
            <div className="flex gap-2">
                <Block className="h-[34px] w-[33%] rounded-md" />
                <Block className="h-[34px] w-[33%] rounded-md" />
                <Block className="h-[34px] w-[33%] rounded-md" />
            </div>
            <div className="flex gap-2">
                <Block className="h-[34px] w-[33%] rounded-md" />
                <Block className="h-[34px] w-[33%] rounded-md" />
                <Block className="h-[34px] w-[33%] rounded-md" />
            </div>
            <Block className="h-3.5 w-40 rounded-md" />
            <div className="flex gap-3">
                <Block className="h-[30px] w-[33%] rounded-[22px]" />
                <Block className="h-[30px] w-[33%] rounded-[22px]" />
                <Block className="h-[30px] w-[33%] rounded-[22px]" />
            </div>
        </div>
    );
}

export const PerpsTradeRouteSkeleton = memo(function PerpsTradeRouteSkeleton() {
    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
            <div className="flex h-11 items-center justify-between px-3">
                <Block className="size-6 rounded-xl" />
                <Block className="h-6 w-[60px] rounded-[10px]" />
                <Block className="h-8 w-20 rounded-2xl" />
            </div>

            <div className="flex flex-col gap-1 px-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Block className="h-6 w-[120px]" />
                        <Block className="h-[18px] w-8 rounded-[10px]" />
                    </div>
                    <Block className="size-6 rounded-xl" />
                </div>
                <div className="flex gap-1">
                    <Block className="h-3.5 w-8 rounded-md" />
                    <Block className="h-3.5 w-12 rounded-md" />
                </div>
            </div>

            <div className="flex min-h-0 gap-2 px-3">
                <div className="flex min-w-0 flex-[143] shrink-0 flex-col gap-1.5">
                    <Block className="h-7 w-full rounded-md" />
                    <Block className="h-3.5 w-full rounded" />
                    {Array.from({ length: 7 }, (_, i) => (
                        <Block key={`ask-${i}`} className="h-6 w-full rounded" />
                    ))}
                    <Block className="h-6 w-20 rounded-md" />
                    {Array.from({ length: 7 }, (_, i) => (
                        <Block key={`bid-${i}`} className="h-6 w-full rounded" />
                    ))}
                    <Block className="h-6 w-full rounded" />
                </div>

                <div className="flex min-w-0 flex-[200] shrink-0 flex-col gap-1.5">
                    <div className="flex gap-1.5">
                        <Block className="h-7 w-3/5 rounded-md" />
                        <Block className="h-7 w-[35%] rounded-md" />
                    </div>
                    <Block className="h-7 w-full rounded-md" />
                    <Block className="h-10 w-full rounded-md" />
                    <Block className="h-10 w-full rounded-md" />
                    <Block className="h-6 w-full rounded-md" />
                    <Block className="h-6 w-full rounded-md" />
                    <Block className="h-3.5 w-20 rounded-md" />
                    <Block className="h-3.5 w-[60px] rounded-md" />
                    <div className="flex flex-col gap-0.5">
                        <Block className="h-6 w-full rounded" />
                        <Block className="h-6 w-full rounded" />
                        <Block className="h-9 w-full rounded-[22px]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <Block className="h-6 w-full rounded" />
                        <Block className="h-6 w-full rounded" />
                        <Block className="h-9 w-full rounded-[22px]" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 px-3 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <Block className="h-6 w-[100px]" />
                        <Block className="h-6 w-20" />
                    </div>
                    <Block className="size-6 rounded-xl" />
                </div>
                <div className="flex items-center justify-between">
                    <Block className="h-3.5 w-[120px] rounded-md" />
                    <Block className="h-7 w-16 rounded-2xl" />
                </div>
                <SkeletonPositionCard />
                <SkeletonPositionCard />
            </div>
        </div>
    );
});
