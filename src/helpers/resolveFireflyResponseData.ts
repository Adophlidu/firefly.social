import { first } from 'lodash-es';

import type { Response } from '@/providers/types/Firefly.js';

export function resolveFireflyResponseData<T>({ data, error }: Response<T>, fallback?: string): T {
    if (error) {
        const errorMsg = Array.isArray(error) ? first(error) : typeof error === 'string' ? error : undefined;
        throw new Error(errorMsg || fallback || 'Unknown error');
    }
    return data as T;
}
