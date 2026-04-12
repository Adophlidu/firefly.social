import type { NeynarResponse } from '@/providers/types/Neynar.js';

export function resolveNeynarResponseData<T>(response: NeynarResponse<T>): T {
    if (!response) throw new Error('The neynar response is null');
    if (typeof response === 'object' && 'code' in response && 'message' in response) {
        throw new Error(response.message);
    }
    return response as T;
}
