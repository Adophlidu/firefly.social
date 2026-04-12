import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import type { OrbResponse } from '@/providers/orb/type.js';

export function createResponseJsonFromOrb<T>(response: OrbResponse<T>, fallback?: string) {
    if (response.status !== 'SUCCESS' || !response.data) {
        return createErrorResponseJson(response.msg || fallback || 'Unknown error', { status: 502 });
    }
    return createSuccessResponseJson(response.data);
}
