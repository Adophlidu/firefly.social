import { logger } from '@/libs/Logger.js';
import { reportException } from '@/providers/errorCapture/reportException.js';

export enum ExceptionId {
    BIND_OR_RESTORE_FIREFLY_SESSION = 'bind_or_restore_firefly_session',
    RESUME_LENS_SESSION = 'resume_lens_session',
    RESUME_BSKY_SESSION = 'resume_bsky_session',
    RESUME_TWITTER_SESSION = 'resume_twitter_session',
    CREATE_PRIVY_WALLET = 'create_privy_wallet',

    // Client-side error capturing
    UI_CRASH = 'ui_crash',
    SNACKBAR_ERROR = 'snackbar_error',
    RUNTIME_ERROR = 'runtime_error',
    UNHANDLED_REJECTION = 'unhandled_rejection',
    REACT_QUERY_ERROR = 'react_query_error',
    RESOURCE_LOAD_ERROR = 'resource_load_error',
    NETWORK_ERROR = 'network_error',
    CHUNK_LOAD_ERROR = 'chunk_load_error',

    // Server-side
    API_ROUTE_ERROR = 'api_route_error',
}

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
        tags,
    });
    if (!queued) {
        logger.warn(`[captureException] beacon not queued for exception: ${exceptionId}`);
    }
}
