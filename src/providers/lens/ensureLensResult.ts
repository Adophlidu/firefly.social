import type { ResultAsync } from '@lens-protocol/client';

export async function ensureLensResult<T, E>(asyncResult: ResultAsync<T, E>) {
    const result = await asyncResult;
    if (!result.isOk()) {
        throw result.error;
    }

    return result.value;
}
