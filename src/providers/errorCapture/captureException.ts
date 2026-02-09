import { logger } from '@/libs/Logger.js';
import { reportException } from '@/providers/firefly/report/reportException.js';

export enum ExceptionId {
    BIND_OR_RESTORE_FIREFLY_SESSION = 'bind_or_restore_firefly_session',
    RESUME_LENS_SESSION = 'resume_lens_session',
    RESUME_BSKY_SESSION = 'resume_bsky_session',
    RESUME_TWITTER_SESSION = 'resume_twitter_session',
    CREATE_PRIVY_WALLET = 'create_privy_wallet',
    USER_REPORT = 'user_report',

    // Client-side error capturing
    UI_CRASH = 'ui_crash',
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
        tags: { exceptionId, ...tags },
    });
    if (!queued) {
        logger.warn(`[captureException] beacon not queued for exception: ${exceptionId}`);
    }
}

// Deduplication cache: fingerprint -> timestamp
const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000; // 5 second deduplication window
const MAX_CACHE_SIZE = 100;

/**
 * Generates a fingerprint for error deduplication
 */
function generateFingerprint(exceptionId: ExceptionId, message: string, stack?: string): string {
    const stackSnippet = stack?.split('\n').slice(0, 3).join('') ?? '';
    return `${exceptionId}:${message}:${stackSnippet}`;
}

/**
 * Checks if error should be reported (not a duplicate within dedup window)
 */
function shouldReport(fingerprint: string): boolean {
    const now = Date.now();
    const lastReported = recentErrors.get(fingerprint);

    if (lastReported && now - lastReported < DEDUP_WINDOW_MS) {
        return false;
    }

    // Clean up old entries if cache is too large
    if (recentErrors.size >= MAX_CACHE_SIZE) {
        const cutoff = now - DEDUP_WINDOW_MS;
        for (const [key, timestamp] of recentErrors) {
            if (timestamp < cutoff) {
                recentErrors.delete(key);
            }
        }
    }

    recentErrors.set(fingerprint, now);
    return true;
}

/**
 * Detects if error is a Next.js chunk loading failure
 */
export function isChunkLoadError(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    return (
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('Loading CSS chunk') ||
        message.includes('Failed to fetch dynamically imported module')
    );
}

/**
 * Detects if error is a network connectivity issue
 */
export function isNetworkError(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    return (
        message.includes('NetworkError') ||
        message.includes('Failed to fetch') ||
        message.includes('Network request failed') ||
        message.includes('net::ERR_') ||
        message.includes('Load failed')
    );
}

/**
 * Classifies an error and returns the appropriate ExceptionId
 */
export function classifyError(error: Error): ExceptionId {
    if (isChunkLoadError(error)) {
        return ExceptionId.CHUNK_LOAD_ERROR;
    }
    if (isNetworkError(error)) {
        return ExceptionId.NETWORK_ERROR;
    }
    return ExceptionId.RUNTIME_ERROR;
}

export interface CaptureClientExceptionOptions {
    /** Additional tags to include in the exception report */
    tags?: Record<string, string | number>;
    /** Skip deduplication check */
    skipDedup?: boolean;
}

/**
 * Captures a client-side exception with deduplication.
 * Wrapper around captureException that adds error fingerprinting.
 */
export function captureClientException(
    exceptionId: ExceptionId,
    error: unknown,
    options?: CaptureClientExceptionOptions,
): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const fingerprint = generateFingerprint(exceptionId, err.message, err.stack);

    if (!options?.skipDedup && !shouldReport(fingerprint)) {
        return;
    }

    captureException(exceptionId, err, options?.tags);
}
