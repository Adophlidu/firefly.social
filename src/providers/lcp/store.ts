/**
 * Performance Store
 *
 * Stores and manages API call metrics for performance analysis.
 */

import { isSameUrl } from '@/helpers/isSameUrl.js';
import { type ApiCallMetrics, type DuplicateGroup, type PerformanceReport } from '@/providers/lcp/types.js';

class PerformanceStore {
    private apiCalls: ApiCallMetrics[] = [];
    public lcpTime: number | null = null;
    private pageLoadTime: number;
    private maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.pageLoadTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    /**
     * Record an API call
     */
    recordApiCall(metrics: ApiCallMetrics): void {
        // Prevent memory bloat
        if (this.apiCalls.length >= this.maxSize) {
            // Remove oldest 10% of calls
            const removeCount = Math.floor(this.maxSize * 0.1);
            this.apiCalls.splice(0, removeCount);
        }

        this.apiCalls.push(metrics);
    }

    /**
     * Set LCP time
     */
    setLCPTime(time: number): void {
        this.lcpTime = time;
        // Update all existing calls with LCP correlation
        this.apiCalls.forEach((call) => {
            if (this.lcpTime !== null) {
                call.beforeLCP = call.endTime < this.lcpTime;
                call.lcpOffset = call.endTime - this.lcpTime;
            }
        });
    }

    /**
     * Get all API calls
     */
    getApiCalls(): ApiCallMetrics[] {
        return [...this.apiCalls];
    }

    /**
     * Get API calls that happened before LCP
     */
    getApiCallsBeforeLCP(): ApiCallMetrics[] {
        if (this.lcpTime === null) return [];
        return this.apiCalls.filter((call) => call.endTime < this.lcpTime!);
    }

    /**
     * Generate performance report
     */
    generateReport(): PerformanceReport {
        const apiCallsBeforeLCP = this.getApiCallsBeforeLCP();

        // Calculate summary statistics
        const totalDuration = this.apiCalls.reduce((sum, call) => sum + call.duration, 0);
        const averageDuration = this.apiCalls.length > 0 ? totalDuration / this.apiCalls.length : 0;
        const slowestCall =
            this.apiCalls.length > 0
                ? this.apiCalls.reduce((slowest, call) => (call.duration > slowest.duration ? call : slowest))
                : null;

        // Group by domain
        const callsByDomain: Record<string, number> = {};
        const callsByDomainDuration: Record<string, number> = {};

        this.apiCalls.forEach((call) => {
            callsByDomain[call.domain] = (callsByDomain[call.domain] || 0) + 1;
            callsByDomainDuration[call.domain] = (callsByDomainDuration[call.domain] || 0) + call.duration;
        });

        const failedCalls = this.apiCalls.filter((call) => !call.success).length;
        const totalDurationBeforeLCP = apiCallsBeforeLCP.reduce((sum, call) => sum + call.duration, 0);

        // Calculate duplicate GET requests using isSameUrl
        const getRequests = this.apiCalls.filter((call) => call.method === 'GET');
        const duplicateGroups: DuplicateGroup[] = [];
        const processedUrls = new Set<string>();

        getRequests.forEach((call) => {
            // Skip if this URL has already been processed as part of a group
            if (processedUrls.has(call.url)) return;

            // Find all GET requests that are the same URL using isSameUrl
            const sameUrlCalls = getRequests.filter((otherCall) => isSameUrl(call.url, otherCall.url));

            if (sameUrlCalls.length > 1) {
                const totalDuration = sameUrlCalls.reduce((sum, c) => sum + c.duration, 0);
                const avgDuration = totalDuration / sameUrlCalls.length;
                const beforeLCPCount = sameUrlCalls.filter((c) => c.beforeLCP).length;
                const domain = sameUrlCalls[0]?.domain || '';

                duplicateGroups.push({
                    url: call.url,
                    method: 'GET',
                    calls: sameUrlCalls,
                    count: sameUrlCalls.length,
                    totalDuration,
                    averageDuration: avgDuration,
                    domain,
                    beforeLCPCount,
                });

                // Mark all URLs in this group as processed
                sameUrlCalls.forEach((c) => processedUrls.add(c.url));
            }
        });

        // Sort duplicate groups by count (descending)
        duplicateGroups.sort((a, b) => b.count - a.count);

        // Calculate duplicate statistics
        const totalDuplicateRequests = duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0);
        const uniqueDuplicatePatterns = duplicateGroups.length;

        return {
            pageLoadTime: this.pageLoadTime,
            lcpTime: this.lcpTime ?? undefined,
            apiCalls: this.getApiCalls(),
            apiCallsBeforeLCP,
            duplicateGroups,
            summary: {
                totalCalls: this.apiCalls.length,
                totalDuration,
                averageDuration,
                slowestCall,
                callsByDomain,
                callsByDomainDuration,
                failedCalls,
                callsBeforeLCP: apiCallsBeforeLCP.length,
                totalDurationBeforeLCP,
                totalDuplicateRequests,
                uniqueDuplicatePatterns,
            },
        };
    }

    /**
     * Clear all stored metrics
     */
    clear(): void {
        this.apiCalls = [];
        this.lcpTime = null;
        this.pageLoadTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    /**
     * Export data as JSON
     */
    export(): string {
        return JSON.stringify(this.generateReport(), null, 2);
    }
}

// Singleton instance
export const performanceStore = new PerformanceStore();
