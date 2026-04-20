import { isZero } from '@dimensiondev/web3/numbers';

export function resolveTwitterPaginationToken(cursor?: string) {
    if (!cursor || isZero(cursor)) return undefined;

    return cursor;
}
