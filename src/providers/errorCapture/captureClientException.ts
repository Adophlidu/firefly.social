import { captureException, type ExceptionId } from '@/providers/errorCapture/captureException.js';

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

interface CaptureClientExceptionOptions {
    exceptionId: ExceptionId;
    /** Additional tags to include in the exception report */
    tags?: Record<string, string | number>;
    /** Skip deduplication check */
    skipDedup?: boolean;
}

/**
 * Captures a client-side exception with deduplication.
 * Wrapper around captureException that adds error fingerprinting.
 */
export function captureClientException(error: unknown, options: CaptureClientExceptionOptions): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const fingerprint = generateFingerprint(options.exceptionId, err.message, err.stack);

    if (!options?.skipDedup && !shouldReport(fingerprint)) {
        return;
    }

    captureException(options.exceptionId, err, options?.tags);
}
