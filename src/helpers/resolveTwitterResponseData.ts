import { AuthenticationError } from '@/constants/error.js';
import type { ResponseJSON } from '@/types/index.js';

export function resolveTwitterResponseData<T>(response: ResponseJSON<T>, message?: string): T {
    if (response.success) return response.data;
    if (response.error.message.includes('The user used for authentication is suspended')) {
        throw new AuthenticationError('The user used for authentication is suspended');
    }
    throw new Error(message ?? response.error.message);
}
