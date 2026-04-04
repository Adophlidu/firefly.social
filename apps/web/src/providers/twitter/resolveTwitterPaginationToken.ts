import { isZero } from '@/helpers/number.js';

export function resolveTwitterPaginationToken(cursor?: string) {
    if (!cursor || isZero(cursor)) return undefined;

    return cursor;
}
