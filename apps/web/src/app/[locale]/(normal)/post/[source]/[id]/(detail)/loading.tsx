'use client';

import { useLayoutEffect } from 'react';

import { useBodyLock } from '@/hooks/useBodyLock.js';

export default function LoadingPage() {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    useBodyLock(true);

    return (
        <div className="max-h-svh animate-pulse overflow-y-hidden border-b-0 px-3 py-2 md:px-4 md:py-3">
            <div className="grid grid-cols-[40px_1fr] gap-3">
                <div className="bg-bg size-10 rounded-full" />
                <div>
                    <div className="bg-bg mt-1 h-3 w-full max-w-28 rounded" />
                    <div className="bg-bg mt-2 h-3 w-full max-w-20 rounded" />
                </div>
            </div>
            <div className="mt-4 space-y-4">
                <div className="bg-bg h-3 w-full rounded" />
                <div className="bg-bg h-3 w-full rounded" />
                <div className="bg-bg h-3 w-3/4 rounded" />
                <div className="bg-bg aspect-square w-full rounded-lg" />
            </div>
        </div>
    );
}
