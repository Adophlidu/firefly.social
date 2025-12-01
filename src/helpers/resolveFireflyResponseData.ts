import { first } from 'lodash-es';

import { NftScanError } from '@/constants/error.js';
import type { Response } from '@/providers/types/Firefly.js';

export function resolveFireflyResponseData<T>({ data, error }: Response<T>, fallback?: string): T {
    if (error) {
        const message = Array.isArray(error) ? first(error) : typeof error === 'string' ? error : undefined;
        if (message?.includes('nftscan get fail')) throw new NftScanError(message);
        throw new Error(message || fallback || 'Unknown error');
    }
    return data as T;
}
