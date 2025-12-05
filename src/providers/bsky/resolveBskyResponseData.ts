import { Source } from '@/constants/enum.js';
import { AccountSuspendedError, NotFoundError } from '@/constants/error.js';

interface Response<T> {
    success: boolean;
    data: T;
}

export function resolveBskyResponseData<T>(response: Response<T>, message?: string) {
    const errorMessage = typeof message === 'string' ? message : 'Failed to resolve bsky response data.';
    if (!response.success) throw new Error(errorMessage);

    return response.data;
}

export async function resolveBskyResponseDataAsync<T>(resolveResponse: () => Promise<Response<T>>, message?: string) {
    try {
        const response = await resolveResponse();
        return resolveBskyResponseData(response, message);
    } catch (error) {
        if (error instanceof Error) {
            const message = error.message;
            if (message.includes('Post not found')) {
                throw new NotFoundError(message);
            }
            if (message.includes('Profile not found')) {
                throw new NotFoundError(message);
            }
            if (message.includes('actor must be a valid did or a handle')) {
                throw new NotFoundError(message);
            }
            if (message.includes('Account has been suspended') || message.includes('Account is deactivated')) {
                throw new AccountSuspendedError('', Source.Bsky, message);
            }
        }
        throw error;
    }
}
