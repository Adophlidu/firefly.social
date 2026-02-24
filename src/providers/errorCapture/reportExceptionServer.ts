/**
 * Server-side exception reporting. Use only in API routes / server context.
 * POSTs directly to the firefly-exception-tracker; does not use sendBeacon.
 */
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { FIREFLY_EXCEPTION_TRACKER_URL, IS_PRODUCTION } from '@/constants/static.js';
import { logger } from '@/libs/Logger.js';
import { normalizeError } from '@/providers/errorCapture/normalizeError.js';

export interface ExceptionServerPayload {
    message: string;
    request_url?: string;
    stack_trace?: string;
    severity?: 'error' | 'warning' | 'critical';
}

/**
 * Reports an exception from the server (e.g. API route) to the firefly-exception-tracker.
 * Message and stack_trace are derived from error; payload supplies the rest.
 * No-op if FIREFLY_EXCEPTION_TRACKER_API_KEY is not configured.
 */
export async function reportExceptionServer(
    error: unknown,
    payload: Partial<ExceptionServerPayload> = {},
): Promise<void> {
    const apiKey = env.internal.FIREFLY_EXCEPTION_TRACKER_API_KEY;
    if (!apiKey) {
        logger.warn('[reportExceptionServer] FIREFLY_EXCEPTION_TRACKER_API_KEY is not configured');
        return;
    }

    try {
        const err = normalizeError(error);
        const url = urlcat(FIREFLY_EXCEPTION_TRACKER_URL, '/api/exceptions', {
            api_key: apiKey,
        });
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,

                // exception type
                exception_type: 'api_route_error',

                // message and stack trace
                message: err.message,
                stack_trace: err.stack,
                severity: 'error',

                // service name
                service_name: 'firefly-server',

                // version
                release_version: env.shared.VERSION,
                commit_hash: env.shared.COMMIT_HASH,

                // environment
                vercel_environment: env.external.NEXT_PUBLIC_VERCEL_ENV,
                environment: IS_PRODUCTION ? 'production' : 'development',
            }),
        });
    } catch {
        // Best-effort; avoid throwing and affecting the API response
    }
}
