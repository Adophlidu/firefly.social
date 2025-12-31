import { NotFoundError } from '@dimensiondev/utils';
import type { ResultAsync } from '@lens-protocol/client';

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
