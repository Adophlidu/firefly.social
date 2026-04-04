import { NotFoundError } from '@dimensiondev/utils';

import { FetchError, InvalidAddressError } from '@/constants/error.js';

export function isChannelNotFoundError(error: unknown) {
    if (error instanceof NotFoundError) return true;
    if (error instanceof InvalidAddressError) return true;
    if (error instanceof FetchError && error.status === 404) return true;

    if (!(error instanceof Error)) return false;

    return error.message === 'Group not found' || error.message === 'Channel not found';
}
