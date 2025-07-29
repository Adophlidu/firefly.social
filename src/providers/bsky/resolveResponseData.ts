import type { ResponseJson } from '@/types/index.js';

export function resolveResponseData<T>(response: ResponseJson<T>, message?: string): T {
    if (!response.success) {
        throw new Error(message || response.error.message || 'Failed to resolve response data.');
    }
    return response.data;
}
