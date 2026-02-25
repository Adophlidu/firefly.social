'use client';

import { useEffect, useRef } from 'react';

import { captureException, type ExceptionId } from '@/core/captureException.js';
import type { ExceptionTags } from '@/types.js';

interface UseReportErrorOnceOptions {
    /** Exception id to report */
    exceptionId: ExceptionId;
    /** Additional tags for the report */
    tags?: ExceptionTags;
}

/**
 * Reports an error to the exception tracker once per error instance.
 * Use in error boundary components (e.g. global-error.tsx, error.tsx) to avoid duplicating
 * the "report once" ref + useEffect pattern.
 */
export function useReportErrorOnce(error: Error | null | undefined, options: UseReportErrorOnceOptions): void {
    const { exceptionId, tags } = options;
    const lastReportedRef = useRef<Error | null>(null);

    useEffect(() => {
        if (!error) return;
        if (lastReportedRef.current === error) return;

        lastReportedRef.current = error;
        captureException(exceptionId, error, tags);
        // Intentionally depend only on error so we report once per error instance
        // with the options that were current when the effect first ran.
    }, [error]);
}
