import { getExceptionTrackerConfig } from '@/config.js';
import { reportException } from '@/core/reportException.js';
import { type ExceptionId } from '@/enums.js';
import { normalizeError } from '@/helpers/normalizeError.js';
import type { ExceptionTags } from '@/types.js';

/**
 * Captures an exception via reportException (sendBeacon). Use this instead of Sentry.
 * Logs a warning if the beacon was not queued.
 *
 * Must call configureExceptionTracker() before using.
 */
export function captureException(exceptionId: ExceptionId, error: unknown, tags?: ExceptionTags): void {
    const cfg = getExceptionTrackerConfig();
    if (!cfg?.getClient?.()) {
        console.warn('[captureException] Client config not configured');
        return;
    }

    const { message, stack } = normalizeError(error);
    const userContext = cfg.getUserContext?.() ?? {};

    const queued = reportException({
        exception_type: exceptionId,

        // message and stack trace
        message,
        stack_trace: stack,
        severity: 'error',

        // social login parameters
        user_id: userContext.user_id,
        twitter_username: userContext.twitter_username,
        lens_handle: userContext.lens_handle,
        farcaster_id: userContext.farcaster_id,
        bsky_id: userContext.bsky_id,

        // tags
        tags,
    });
    if (!queued) {
        console.warn(`[captureException] beacon not queued for exception: ${exceptionId}`);
    }
}

export { ExceptionId } from '@/enums.js';
