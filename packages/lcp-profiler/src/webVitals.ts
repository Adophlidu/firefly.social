/**
 * Web Vitals Integration
 *
 * Observes LCP and correlates stored API calls with LCP timing.
 */

import { performanceStore } from '@/store.js';
import { type WebVitalsInitOptions } from '@/types.js';

let lcpObserver: PerformanceObserver | null = null;
let lcpValue: number | null = null;

export function initWebVitalsTracking(options?: WebVitalsInitOptions): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }

    const onError =
        options?.onObserverError ??
        ((error: unknown) => {
            console.warn('[lcp-profiler] Failed to initialize Web Vitals tracking:', error);
        });

    try {
        lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
                renderTime?: number;
                loadTime?: number;
            };

            if (lastEntry) {
                const lcpTime = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
                if (lcpTime && (!lcpValue || lcpTime > lcpValue)) {
                    lcpValue = lcpTime;
                    performanceStore.setLCPTime(lcpTime);
                }
            }
        });

        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
        onError(error);
    }
}
