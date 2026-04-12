import type { FireflyResponse } from '@/types/firefly';

export function resolveFireflyResponseData<T>({ data, error }: FireflyResponse<T>, fallback?: string): T {
    if (error) {
        const message = Array.isArray(error) ? error?.[0] : typeof error === 'string' ? error : undefined;
        throw new Error(message || fallback || 'Unknown error');
    }
    return data as T;
}
