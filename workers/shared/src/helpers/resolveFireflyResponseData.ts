import { first } from '@/shared/src/helpers/first.js';
import type { FireflyResponse } from '@/shared/src/types/firefly.js';

export function resolveFireflyResponseData<T>({ data, error }: FireflyResponse<T>): T {
    if (error) {
        const errorMsg = Array.isArray(error) ? first(error) : typeof error === 'string' ? error : undefined;
        throw new Error(errorMsg || 'Unknown error');
    }
    return data as T;
}
