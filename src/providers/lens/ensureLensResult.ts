import type { ResultAsync } from '@lens-protocol/client';

import { NotFoundError } from '@/constants/error.js';

export async function ensureLensResult<T, E>(asyncResult: ResultAsync<T, E>) {
    try {
        const result = await asyncResult;
        if (!result.isOk()) {
            throw result.error;
        }

        return result.value;
    } catch (error) {
        if (error instanceof Error && error.message.includes('Unknown post slug supplied')) {
            throw new NotFoundError(error.message);
        }
        throw error;
    }
}
