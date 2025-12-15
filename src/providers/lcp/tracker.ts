/**
 * Performance Tracker
 *
 * Tracks external API calls and measures their performance.
 */

import { parseUrl } from '@dimensiondev/utils';

import { performanceStore } from '@/providers/lcp/store.js';
import type { ApiCallMetrics, PerformanceConfig } from '@/providers/lcp/types.js';

let config: PerformanceConfig = {
    enabled: false,
    trackExternalOnly: true,
    minDurationThreshold: 0,
    maxTrackedCalls: 1000,
    detailedTiming: true,
    captureStackTrace: false,
    excludedDomains: [],
};

let callCounter = 0;

/**
 * Initialize the performance tracker
 */
export function initPerformanceTracker(customConfig?: Partial<PerformanceConfig>): void {
    config = {
        ...config,
        ...customConfig,
    };
}

/**
 * Check if tracking is enabled
 */
export function isTrackingEnabled(): boolean {
    return config.enabled;
}

/**
 * Check if URL should be tracked
 */
function shouldTrackUrl(url: string): boolean {
    if (!config.enabled) return false;

    try {
        const parsed = parseUrl(url, { autoFixProtocol: false });
        if (!parsed) return false;

        const domain = parsed.hostname;

        // Check excluded domains
        if (config.excludedDomains.some((excluded) => domain.includes(excluded))) {
            return false;
        }

        // If tracking external only, check if it's external
        if (config.trackExternalOnly) {
            if (typeof window !== 'undefined') {
                const currentOrigin = window.location.origin;
                return parsed.origin !== currentOrigin;
            }
            // Server-side: consider all URLs as external for now
            return true;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
    try {
        const parsed = parseUrl(url, { autoFixProtocol: false });
        return parsed?.hostname || 'unknown';
    } catch {
        return 'unknown';
    }
}

/**
 * Get stack trace (client-side only)
 */
function getStackTrace(): string | undefined {
    if (!config.captureStackTrace || typeof window === 'undefined') {
        return undefined;
    }

    try {
        throw new Error();
    } catch (e) {
        if (e instanceof Error && e.stack) {
            // Remove first few lines (this function and tracker calls)
            const lines = e.stack.split('\n');
            return lines.slice(3, 10).join('\n');
        }
    }

    return undefined;
}

/**
 * Sanitize headers (remove sensitive data)
 */
function sanitizeHeaders(headers?: HeadersInit): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized: Record<string, string> = {};
    const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.includes(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        });
    } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.includes(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = String(value);
            }
        });
    } else {
        Object.entries(headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.includes(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = String(value);
            }
        });
    }

    return sanitized;
}

/**
 * Track an API call
 */
export async function trackApiCall(
    url: string,
    init: RequestInit | undefined,
    fetchFn: () => Promise<Response>,
): Promise<Response> {
    if (!shouldTrackUrl(url)) {
        return fetchFn();
    }

    const callId = `api-call-${++callCounter}`;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const method = init?.method || 'GET';
    const domain = extractDomain(url);
    const requestHeaders = sanitizeHeaders(init?.headers);
    const stackTrace = getStackTrace();

    let endTime: number;
    let status = 0;
    let success = false;
    let responseSize: number | undefined;
    let responseHeaders: Record<string, string> | undefined;
    let error: string | undefined;
    let timing: PerformanceResourceTiming | undefined;

    try {
        const response = await fetchFn();
        endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

        status = response.status;
        success = status >= 200 && status < 300;
        responseHeaders = sanitizeHeaders(response.headers);

        // Try to get response size
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            responseSize = parseInt(contentLength, 10);
        }

        // Get resource timing if available
        if (typeof performance !== 'undefined' && 'getEntriesByType' in performance) {
            const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            const entry = entries.find((e) => e.name === url);
            if (entry) {
                timing = entry;
            }
        }

        // Record metrics
        const duration = endTime - startTime;
        if (duration >= config.minDurationThreshold) {
            const metrics: ApiCallMetrics = {
                id: callId,
                url,
                domain,
                method,
                startTime,
                endTime,
                duration,
                status,
                success,
                responseSize,
                requestHeaders,
                responseHeaders,
                timing: config.detailedTiming ? timing : undefined,
                stackTrace,
            };

            // Update LCP correlation if LCP has been measured
            const lcpTime = performanceStore.lcpTime;
            if (lcpTime !== null) {
                metrics.beforeLCP = endTime < lcpTime;
                metrics.lcpOffset = endTime - lcpTime;
            }

            performanceStore.recordApiCall(metrics);

            // Call callback if provided
            config.onApiCallComplete?.(metrics);
        }

        return response;
    } catch (err) {
        endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        error = err instanceof Error ? err.message : String(err);
        success = false;

        const duration = endTime - startTime;
        const metrics: ApiCallMetrics = {
            id: callId,
            url,
            domain,
            method,
            startTime,
            endTime,
            duration,
            status,
            success,
            error,
            requestHeaders,
            stackTrace,
        };

        performanceStore.recordApiCall(metrics);
        config.onApiCallComplete?.(metrics);

        throw err;
    }
}

/**
 * Get current configuration
 */
export function getConfig(): PerformanceConfig {
    return { ...config };
}
