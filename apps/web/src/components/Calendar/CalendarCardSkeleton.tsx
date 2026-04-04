import React from 'react';

export function EventSkeleton() {
    return (
        <div className="space-y-3">
            <div className="flex h-6 w-full justify-between rounded">
                <div className="bg-bg h-6 w-1/4 rounded" />
            </div>
            <div className="bg-bg h-4 w-3/4 rounded" />
            <div className="bg-bg h-4 w-1/2 rounded" />
        </div>
    );
}

export function CalendarCardSkeleton() {
    return (
        <div className="border-line relative flex h-[605px] w-full animate-pulse flex-col rounded-xl border">
            {/* Tab Bar Skeleton */}
            <div className="bg-bg flex h-[46px] rounded-t-xl px-4 pt-2">
                <div className="bg-bg mr-2 h-[38px] flex-1 rounded-t-xl px-4 py-[11px]" />
                <div className="bg-bg ml-2 h-[38px] flex-1 rounded-t-xl px-4 py-[11px]" />
            </div>
            {/* Date Picker Skeleton */}
            <div className="flex items-center gap-2 px-4 py-3">
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
                <div className="bg-bg size-6 rounded-full" />
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
