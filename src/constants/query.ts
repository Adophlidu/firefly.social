/** Stale time constants for TanStack Query (in milliseconds) */
export const STALE_TIMES = {
    /** 1 minute */
    MINUTE_1: 1_000 * 60,
    /** 2 minutes */
    MINUTE_2: 1_000 * 60 * 2,
    /** 3 minutes */
    MINUTE_3: 1_000 * 60 * 3,
    /** 5 minutes */
    MINUTE_5: 1_000 * 60 * 5,
    /** 10 minutes */
    MINUTE_10: 1_000 * 60 * 10,
    /** 30 minutes */
    MINUTE_30: 1_000 * 60 * 30,
    /** 1 hour */
    HOUR_1: 1_000 * 60 * 60,
    /** Never expire */
    INFINITY: Infinity,
} as const;
