import { AuthenticationError, NotFoundError } from '@dimensiondev/utils';

import { type ResponseJson } from '@/types/utility.js';

export function resolveTwitterResponseData<T>(response: ResponseJson<T>, message?: string): T {
    if (response.success) return response.data;
    if (response.error.message === 'Post not found') throw new NotFoundError(response.error.message);
    if (response.error.message.includes('The user used for authentication is suspended')) {
        throw new AuthenticationError('The user used for authentication is suspended');
    }
    throw new Error(message ?? response.error.message);
}
