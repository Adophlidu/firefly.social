/**
 * API Performance Profiling Types
 *
 * Types for tracking external API call performance
 * to identify bottlenecks affecting LCP (Largest Contentful Paint).
 */

export interface ApiCallMetrics {
    /** Unique identifier for this API call */
    id: string;
    /** Full URL of the API call */
    url: string;
    /** Domain/hostname extracted from URL */
    domain: string;
    /** HTTP method (GET, POST, etc.) */
    method: string;
    /** Request start timestamp (performance.now()) */
    startTime: number;
    /** Request end timestamp (performance.now()) */
    endTime: number;
    /** Total duration in milliseconds */
    duration: number;
    /** HTTP status code */
    status: number;
    /** Whether the request was successful (2xx) */
    success: boolean;
    /** Size of response in bytes (if available) */
    responseSize?: number;
    /** Request headers (sanitized) */
    requestHeaders?: Record<string, string>;
    /** Response headers (sanitized) */
    responseHeaders?: Record<string, string>;
    /** Error message if request failed */
    error?: string;
    /** Resource Timing API breakdown (if available) */
    timing?: PerformanceResourceTiming;
    /** Whether this call happened before LCP */
    beforeLCP?: boolean;
    /** Time relative to LCP (negative = before LCP, positive = after) */
    lcpOffset?: number;
    /** Stack trace of where the API call was made (client-side only) */
    stackTrace?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

export interface DuplicateGroup {
    /** Representative URL for this duplicate group */
    url: string;
    /** HTTP method */
    method: string;
    /** All API calls in this duplicate group */
    calls: ApiCallMetrics[];
    /** Number of duplicate calls */
    count: number;
    /** Total duration of all calls in this group */
    totalDuration: number;
    /** Average duration of calls in this group */
    averageDuration: number;
    /** Domain of the calls */
    domain: string;
    /** Number of calls that happened before LCP */
    beforeLCPCount: number;
}

export interface PerformanceReport {
    /** Page load timestamp */
    pageLoadTime: number;
    /** LCP timestamp (if measured) */
    lcpTime?: number;
    /** All API calls made during page load */
    apiCalls: ApiCallMetrics[];
    /** API calls that happened before LCP */
    apiCallsBeforeLCP: ApiCallMetrics[];
    /** Duplicate GET request groups (using isSameUrl for comparison) */
    duplicateGroups: DuplicateGroup[];
    /** Summary statistics */
    summary: {
        totalCalls: number;
        totalDuration: number;
        averageDuration: number;
        slowestCall: ApiCallMetrics | null;
        callsByDomain: Record<string, number>;
        callsByDomainDuration: Record<string, number>;
        failedCalls: number;
        callsBeforeLCP: number;
        totalDurationBeforeLCP: number;
        /** Total number of duplicate requests (count - 1 for each duplicate group) */
        totalDuplicateRequests: number;
        /** Number of unique duplicate patterns */
        uniqueDuplicatePatterns: number;
    };
}

export interface PerformanceConfig {
    /** Enable/disable performance tracking */
    enabled: boolean;
    /** Only track external APIs (exclude same-origin) */
    trackExternalOnly: boolean;
    /** Minimum duration threshold to log (ms) */
    minDurationThreshold: number;
    /** Maximum number of API calls to track */
    maxTrackedCalls: number;
    /** Enable detailed timing breakdown */
    detailedTiming: boolean;
    /** Enable stack trace capture (client-side only) */
    captureStackTrace: boolean;
    /** Domains to exclude from tracking */
    excludedDomains: string[];
    /** Callback when API call completes */
    onApiCallComplete?: (metrics: ApiCallMetrics) => void;
    /** Callback when report is generated */
    onReportGenerated?: (report: PerformanceReport) => void;
}

export interface WebVitalsInitOptions {
    /** Called when PerformanceObserver setup throws (e.g. unsupported browser) */
    onObserverError?: (error: unknown) => void;
}
