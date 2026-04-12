import type { Result } from '@lens-protocol/client';

export function ensureLensResultSync<T, E>(result: Result<T, E>) {
    if (!result.isOk()) {
        throw result.error;
    }

    return result.value;
}
