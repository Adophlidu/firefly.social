/**
 * Web Vitals Integration
 *
 * Integrates with Web Vitals API to correlate API calls with LCP timing.
 */

import { logger } from '@/libs/Logger.js';
import { performanceStore } from '@/providers/lcp/store.js';

let lcpObserver: PerformanceObserver | null = null;
let lcpValue: number | null = null;

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitalsTracking(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }

    try {
        // Track LCP (Largest Contentful Paint)
        lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
                renderTime?: number;
                loadTime?: number;
            };

            // LCP is the last entry
            if (lastEntry) {
                // Use renderTime if available, otherwise loadTime or startTime
                // These values are already relative to navigation start (same as performance.now())
                const lcpTime = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
                if (lcpTime && (!lcpValue || lcpTime > lcpValue)) {
                    lcpValue = lcpTime;
                    // LCP time is already in the same time domain as performance.now()
                    // (both are relative to navigation start)
                    performanceStore.setLCPTime(lcpTime);
                }
            }
        });

        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
        logger.warn('[Performance] Failed to initialize Web Vitals tracking:', error);
    }
}
