import { performanceStore } from '@/store.js';
import { initPerformanceTracker } from '@/tracker.js';
import { type PerformanceConfig, type WebVitalsInitOptions } from '@/types.js';
import { initWebVitalsTracking } from '@/webVitals.js';

export { getConfig, initPerformanceTracker, isTrackingEnabled, trackApiCall } from '@/tracker.js';
export type {
    ApiCallMetrics,
    DuplicateGroup,
    PerformanceConfig,
    PerformanceReport,
    WebVitalsInitOptions,
} from '@/types.js';

/**
 * Initialize performance profiling (API tracker + client-side LCP observer).
 */
export function initPerformanceProfiling(
    config?: Partial<PerformanceConfig>,
    webVitalsOptions?: WebVitalsInitOptions,
): void {
    initPerformanceTracker(config);

    if (typeof window !== 'undefined') {
        initWebVitalsTracking(webVitalsOptions);
    }
}

export function getPerformanceReport() {
    return performanceStore.generateReport();
}

export function exportPerformanceData(): string {
    return performanceStore.export();
}

export function clearPerformanceData(): void {
    performanceStore.clear();
}
