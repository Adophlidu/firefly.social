'use client';

import { useEffect, useRef } from 'react';

import { captureClientException } from '@/providers/errorCapture/captureClientException.js';
import { ExceptionId } from '@/providers/errorCapture/captureException.js';

interface UseReportErrorOnceOptions {
    /** Exception id to report (default: UI_CRASH) */
    exceptionId?: ExceptionId;
    /** Additional tags for the report */
    tags?: Record<string, string | number>;
}

/**
 * Reports an error to the exception tracker once per error instance.
 * Use in error boundary components (e.g. global-error.tsx, error.tsx) to avoid duplicating
 * the "report once" ref + useEffect pattern.
 */
export function useReportErrorOnce(error: Error | null | undefined, options?: UseReportErrorOnceOptions): void {
    const { exceptionId = ExceptionId.UI_CRASH, tags } = options ?? {};
    const lastReportedRef = useRef<Error | null>(null);

    useEffect(() => {
        if (!error) return;
        if (lastReportedRef.current === error) return;

        lastReportedRef.current = error;
        captureClientException(exceptionId, error, { tags });
        // Intentionally depend only on error so we report once per error instance
        // with the options that were current when the effect first ran.
    }, [error]);
}
