/**
 * Performance Store
 *
 * Stores and manages API call metrics for performance analysis.
 */

import type { ApiCallMetrics, PerformanceReport } from '@/providers/lcp/types.js';

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

        return {
            pageLoadTime: this.pageLoadTime,
            lcpTime: this.lcpTime ?? undefined,
            apiCalls: this.getApiCalls(),
            apiCallsBeforeLCP,
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
