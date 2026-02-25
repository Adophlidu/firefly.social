import { getExceptionTrackerConfig } from '@/config.js';
import { normalizeError } from '@/helpers/normalizeError.js';
import type { ExceptionServerPayload } from '@/types.js';

/**
 * Reports an exception from the server (e.g. API route) to the firefly-exception-tracker.
 * Message and stack_trace are derived from error; payload supplies the rest.
 * No-op if server config is not configured.
 *
 * Must call configureExceptionTracker() with server config before using.
 */
export async function reportExceptionServer(
    error: unknown,
    payload: Partial<ExceptionServerPayload> = {},
): Promise<void> {
    const cfg = getExceptionTrackerConfig()?.getServer?.();
    if (!cfg?.baseUrl) {
        console.warn('[reportExceptionServer] Server config or baseUrl is not configured');
        return;
    }

    try {
        const err = normalizeError(error);
        const base = cfg.baseUrl.replace(/\/$/, '');
        const url = `${base}/api/exceptions`;
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
                service_name: cfg.serviceName ?? 'firefly-server',

                // version
                release_version: cfg.version ?? '',
                commit_hash: cfg.commitHash ?? '',

                // environment
                vercel_environment: cfg.vercelEnvironment,
                environment: cfg.environment,
            }),
        });
    } catch {
        // Best-effort; avoid throwing and affecting the API response
    }
}
