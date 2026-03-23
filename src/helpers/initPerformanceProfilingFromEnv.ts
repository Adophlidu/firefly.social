/* cspell:disable */

import { initPerformanceProfiling, type PerformanceConfig } from '@dimensiondev/lcp-profiler';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { logger } from '@/libs/Logger.js';

/**
 * Initialize performance profiling from environment variables
 */
export function initPerformanceProfilingFromEnv(): void {
    const isEnabled = env.external.NEXT_PUBLIC_API_PERFORMANCE_PROFILING === STATUS.Enabled;
    logger.info(`[initPerformanceProfilingFromEnv] Performance profiling is ${isEnabled ? 'enabled' : 'disabled'}`);

    if (!isEnabled) return;

    const config: Partial<PerformanceConfig> = {
        enabled: true,
        trackExternalOnly: true,
        minDurationThreshold: 0, // Track all calls
        maxTrackedCalls: 1000,
        detailedTiming: true,
        captureStackTrace: typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
        excludedDomains: [
            // Exclude static media domains
            'media.firefly.land',
            // Exclude analytics/telemetry
            'www.googletagmanager.com',
            'static.cloudflareinsights.com',
        ],
    };

    initPerformanceProfiling(config);
}
