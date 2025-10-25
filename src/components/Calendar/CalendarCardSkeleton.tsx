import React from 'react';

export function EventSkeleton() {
    return (
        <div className="space-y-3">
            <div className="flex h-6 w-full justify-between rounded">
                <div className="h-6 w-1/4 rounded bg-bg" />
            </div>
            <div className="h-4 w-3/4 rounded bg-bg" />
            <div className="h-4 w-1/2 rounded bg-bg" />
        </div>
    );
}

export function CalendarCardSkeleton() {
    return (
        <div className="relative flex h-[605px] w-full animate-pulse flex-col rounded-xl border border-line">
            {/* Tab Bar Skeleton */}
            <div className="flex h-[46px] rounded-t-xl bg-bg px-4 pt-2">
                <div className="mr-2 h-[38px] flex-1 rounded-t-xl bg-bg px-4 py-[11px]" />
                <div className="ml-2 h-[38px] flex-1 rounded-t-xl bg-bg px-4 py-[11px]" />
            </div>
            {/* Date Picker Skeleton */}
            <div className="flex items-center gap-2 px-4 py-3">
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
                <div className="size-6 rounded-full bg-bg" />
            </div>
            {/* Content Area Skeleton */}
            <div className="flex flex-col gap-10 rounded-b-xl p-10">
                {Array.from({ length: 4 }).map((_, index) => {
                    return <EventSkeleton key={index} />;
                })}
            </div>
        </div>
    );
}
