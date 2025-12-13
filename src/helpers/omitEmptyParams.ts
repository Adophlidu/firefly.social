import { logger } from '@/libs/Logger.js';
import { omitBy } from 'lodash-es';

export function omitEmptyParams<T extends object>(obj: T) {
    return omitBy(obj, (x, key) => {
        const omit = typeof x === 'undefined' || x === '';
        if (omit) logger.warn(`[omitEmptyParams] ${key} is empty string or undefined`);
        return omit;
    });
}
