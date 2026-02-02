import { bom } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { FIREFLY_EXCEPTION_TRACKER_URL, IS_PRODUCTION } from '@/constants/static.js';

export interface ReportExceptionPayload {
    message: string;
    exception_type?: string;
    service_name?: string;
    stack_trace?: string;
    environment?: string;
    severity?: 'error' | 'warning' | 'info';
    request_url?: string;
    release_version?: string;
    tags?: Record<string, string | number | boolean>;
}

export interface ReportExceptionResponse {
    success: boolean;
    id?: number;
    message: string;
}

/**
 * Sends an exception report to the remote exception tracker.
 */
export async function reportException(payload: ReportExceptionPayload): Promise<ReportExceptionResponse> {
    const apiKey = env.external.NEXT_PUBLIC_FIREFLY_EXCEPTION_TRACKER_API_KEY;
    if (!apiKey) {
        throw new Error('reportException: NEXT_PUBLIC_FIREFLY_EXCEPTION_TRACKER_API_KEY is not set');
    }

    const url = urlcat(FIREFLY_EXCEPTION_TRACKER_URL, '/api/exceptions');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
        },
        body: JSON.stringify({
            ...payload,
            service_name: 'firefly-web',
            release_version: process.version,
            environment: IS_PRODUCTION ? 'production' : 'development',
            request_url: bom.location?.href,
        }),
    });

    if (!response.ok) {
        throw new Error(`reportException failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<ReportExceptionResponse>;
}
