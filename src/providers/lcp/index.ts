import { performanceStore } from '@/providers/lcp/store.js';
import { initPerformanceTracker } from '@/providers/lcp/tracker.js';
import { type PerformanceConfig } from '@/providers/lcp/types.js';
import { initWebVitalsTracking } from '@/providers/lcp/webVitals.js';

/**
 * Initialize performance profiling
 */
export function initPerformanceProfiling(config?: Partial<PerformanceConfig>): void {
    initPerformanceTracker(config);

    // Initialize Web Vitals tracking on client side
    if (typeof window !== 'undefined') {
        initWebVitalsTracking();
    }
}

/**
 * Get current performance report
 */
export function getPerformanceReport() {
    return performanceStore.generateReport();
}

/**
 * Export performance data as JSON
 */
export function exportPerformanceData(): string {
    return performanceStore.export();
}

/**
 * Clear all performance data
 */
export function clearPerformanceData(): void {
    performanceStore.clear();
}
