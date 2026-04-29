import { first } from 'lodash-es';

import { FireflyApiError } from '@/constants/error.js';
import type { Response } from '@/providers/types/Firefly.js';

export function resolveFireflyResponseData<T>({ data, error, code }: Response<T>): T {
    if (error) {
        const errorMsg = Array.isArray(error) ? first(error) : typeof error === 'string' ? error : undefined;
        throw new FireflyApiError(errorMsg || 'Unknown error', code);
    }
    return data as T;
}
