import { getErrorMessage } from '@/providers/errorCapture/getErrorMessage.js';

export function normalizeError(error: unknown) {
    return error instanceof Error ? error : new Error(getErrorMessage(error));
}
