/**
 * Performance Store
 *
 * Stores and manages API call metrics for performance analysis.
 */

import { isSameUrl } from '@/isSameUrl.js';
import { type ApiCallMetrics, type DuplicateGroup, type PerformanceReport } from '@/types.js';

class PerformanceStore {
    private apiCalls: ApiCallMetrics[] = [];
    public lcpTime: number | null = null;
    private pageLoadTime: number;
    private maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.pageLoadTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    recordApiCall(metrics: ApiCallMetrics): void {
        if (this.apiCalls.length >= this.maxSize) {
            const removeCount = Math.floor(this.maxSize * 0.1);
            this.apiCalls.splice(0, removeCount);
        }

        this.apiCalls.push(metrics);
    }

    setLCPTime(time: number): void {
        this.lcpTime = time;
        this.apiCalls.forEach((call) => {
            if (this.lcpTime !== null) {
                call.beforeLCP = call.endTime < this.lcpTime;
                call.lcpOffset = call.endTime - this.lcpTime;
            }
        });
    }

    getApiCalls(): ApiCallMetrics[] {
        return [...this.apiCalls];
    }

    getApiCallsBeforeLCP(): ApiCallMetrics[] {
        if (this.lcpTime === null) return [];
        return this.apiCalls.filter((call) => call.endTime < this.lcpTime!);
    }

    generateReport(): PerformanceReport {
        const apiCallsBeforeLCP = this.getApiCallsBeforeLCP();

        const totalDuration = this.apiCalls.reduce((sum, call) => sum + call.duration, 0);
        const averageDuration = this.apiCalls.length > 0 ? totalDuration / this.apiCalls.length : 0;
        const slowestCall =
            this.apiCalls.length > 0
                ? this.apiCalls.reduce((slowest, call) => (call.duration > slowest.duration ? call : slowest))
                : null;

        const callsByDomain: Record<string, number> = {};
        const callsByDomainDuration: Record<string, number> = {};

        this.apiCalls.forEach((call) => {
            callsByDomain[call.domain] = (callsByDomain[call.domain] || 0) + 1;
            callsByDomainDuration[call.domain] = (callsByDomainDuration[call.domain] || 0) + call.duration;
        });

        const failedCalls = this.apiCalls.filter((call) => !call.success).length;
        const totalDurationBeforeLCP = apiCallsBeforeLCP.reduce((sum, call) => sum + call.duration, 0);

        const getRequests = this.apiCalls.filter((call) => call.method === 'GET');
        const duplicateGroups: DuplicateGroup[] = [];
        const processedUrls = new Set<string>();

        getRequests.forEach((call) => {
            if (processedUrls.has(call.url)) return;

            const sameUrlCalls = getRequests.filter((otherCall) => isSameUrl(call.url, otherCall.url));

            if (sameUrlCalls.length > 1) {
                const groupTotalDuration = sameUrlCalls.reduce((sum, c) => sum + c.duration, 0);
                const avgDuration = groupTotalDuration / sameUrlCalls.length;
                const beforeLCPCount = sameUrlCalls.filter((c) => c.beforeLCP).length;
                const domain = sameUrlCalls[0]?.domain || '';

                duplicateGroups.push({
                    url: call.url,
                    method: 'GET',
                    calls: sameUrlCalls,
                    count: sameUrlCalls.length,
                    totalDuration: groupTotalDuration,
                    averageDuration: avgDuration,
                    domain,
                    beforeLCPCount,
                });

                sameUrlCalls.forEach((c) => processedUrls.add(c.url));
            }
        });

        duplicateGroups.sort((a, b) => b.count - a.count);

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

    clear(): void {
        this.apiCalls = [];
        this.lcpTime = null;
        this.pageLoadTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    export(): string {
        return JSON.stringify(this.generateReport(), null, 2);
    }
}

export const performanceStore = new PerformanceStore();
