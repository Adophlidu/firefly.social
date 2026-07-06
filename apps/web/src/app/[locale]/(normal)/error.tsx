'use client';

import { ExceptionId, isChunkLoadError, reloadOnceForChunkError } from '@dimensiondev/exception-tracker';
import { useReportErrorOnce } from '@dimensiondev/exception-tracker/client';
import { useEffect } from 'react';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { usePathname } from '@/esm/navigation.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    const pathname = usePathname();
    const isChunk = isChunkLoadError(error);

    useReportErrorOnce(error, {
        exceptionId: ExceptionId.UI_CRASH,
        tags: { handler: 'error.tsx', pathname: pathname ?? '' },
    });

    // Transient chunk-load failures reach this boundary when a lazy chunk fails
    // to load. Reload once per failure cycle instead of rendering a crash page
    // that Google's renderer would index as a soft 404.
    useEffect(() => {
        if (isChunk) reloadOnceForChunkError(error);
    }, [isChunk, error]);

    if (isChunk) {
        // Reload is pending (or was already attempted once this cycle). Render a
        // minimal, indexable fallback — never the crash UI.
        return (
            <div className="flex h-screen flex-col items-center justify-center">
                <span className="text-lg font-bold">Firefly</span>
            </div>
        );
    }

    return <ErrorHandler error={error} reset={reset} />;
}
