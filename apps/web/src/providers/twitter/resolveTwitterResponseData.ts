import { AuthenticationError, NotFoundError } from '@dimensiondev/utils';

import type { ResponseJson } from '@/types/utility.js';

export function resolveTwitterResponseData<T>(response: ResponseJson<T>, message?: string): T {
    if (response.success) return response.data;
    const errorMessage = response.error.message;
    if (errorMessage === 'Post not found') throw new NotFoundError(errorMessage);
    if (errorMessage.includes('The user used for authentication is suspended')) {
        throw new AuthenticationError('The user used for authentication is suspended');
    }
    if (errorMessage === 'Unauthorized') {
        throw new AuthenticationError(errorMessage);
    }
    throw new Error(message ?? errorMessage);
}
