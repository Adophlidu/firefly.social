import { createErrorResponseJsonFromError } from '@/shared/src/helpers/createResponseJson.js';

export async function withErrorHandler(next: () => Promise<Response>) {
    try {
        return await next();
    } catch (error) {
        return createErrorResponseJsonFromError(error);
    }
}
