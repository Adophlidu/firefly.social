import type { ResponseJson, ResponseJsonRpc } from '@/shared/src/types/firefly.js';

export function resolveResponseData<T>(response: ResponseJson<T>, message?: string): T {
    if (!response.success) {
        throw new Error(message || response.error.message || 'Failed to resolve response data.');
    }
    return response.data;
}

export function resolveResponseDataRpc<T>(response: ResponseJsonRpc<T>, message?: string): T {
    const data = resolveResponseData(response, message);
    return data.result;
}
