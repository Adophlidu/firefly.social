import { has } from 'lodash-es';

import type { PrivyResponse } from '@/providers/types/PrivyAuth.js';

export function resolvePrivyResponse<T>(response: PrivyResponse<T>): T {
    if (has(response, 'error')) {
        const message = typeof response.error === 'string' ? response.error : 'An unknown error occurred';
        throw new Error(message);
    }

    return response as T;
}
