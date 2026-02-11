/**
 * Server-side exception reporting. Use only in API routes / server context.
 * POSTs directly to the firefly-exception-tracker; does not use sendBeacon.
 */
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { FIREFLY_EXCEPTION_TRACKER_URL, IS_PRODUCTION } from '@/constants/static.js';

export interface ReportExceptionServerPayload {
    message: string;
    exception_type?: string;
    request_url?: string;
    stack_trace?: string;
    severity?: 'error' | 'warning' | 'critical';
    tags?: Record<string, string | number | boolean>;
}

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

/**
 * Reports an exception from the server (e.g. API route) to the firefly-exception-tracker.
 * Message and stack_trace are derived from error; payload supplies the rest.
 * No-op if FIREFLY_EXCEPTION_TRACKER_API_KEY is not configured.
 */
export async function reportExceptionServer(
    error: unknown,
    payload: Partial<ReportExceptionServerPayload> = {},
): Promise<void> {
    const apiKey = env.internal.FIREFLY_EXCEPTION_TRACKER_API_KEY;
    if (!apiKey) return;

    const err = normalizeError(error);
    const body = {
        ...payload,
        message: err.message,
        stack_trace: err.stack,
        severity: 'error',
        service_name: 'firefly-server',
        release_version: env.shared.VERSION,
        commit_hash: env.shared.COMMIT_HASH,
        vercel_environment: env.external.NEXT_PUBLIC_VERCEL_ENV,
        environment: IS_PRODUCTION ? 'production' : 'development',
        ...(payload.tags && {
            tags: Object.fromEntries(Object.entries(payload.tags).map(([k, v]) => [k, String(v)])),
        }),
    };

    const url = urlcat(FIREFLY_EXCEPTION_TRACKER_URL, '/api/exceptions', {
        api_key: apiKey,
    });

    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        // Best-effort; avoid throwing and affecting the API response
    }
}
