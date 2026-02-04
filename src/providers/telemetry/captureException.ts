import { logger } from '@/libs/Logger.js';
import { reportException } from '@/providers/firefly/report/reportException.js';
import { type ExceptionId } from '@/providers/types/Telemetry.js';

/**
 * Captures an exception via reportException (sendBeacon). Use this instead of Sentry.
 * Logs a warning if the beacon was not queued.
 */
export function captureException(
    exceptionId: ExceptionId,
    error: unknown,
    tags?: Record<string, string | number>,
): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const queued = reportException({
        message: err.message,
        exception_type: exceptionId,
        stack_trace: err.stack,
        severity: 'error',
        tags: { exceptionId, ...tags } as Record<string, string | number | boolean>,
    });
    if (!queued) {
        logger.warn(`[captureException] beacon not queued for exception: ${exceptionId}`);
    }
}
