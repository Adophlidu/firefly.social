import { getErrorMessage } from '@/helpers/getErrorMessage.js';

export function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(getErrorMessage(error));
}
