import { logger } from '@/lib/Logger.js';

export function runInSafe<T>(fn: () => T, noThrow = true, defaultValue?: T) {
    try {
        return fn();
    } catch (error) {
        if (!noThrow) throw error;
        logger.error(`[runInSafe] ${error}`);
        return defaultValue;
    }
}
