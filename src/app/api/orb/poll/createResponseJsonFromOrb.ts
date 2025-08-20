import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import type { OrbPollResponse } from '@/providers/orb/type.js';

export function createResponseJsonFromOrb<T>(response: OrbPollResponse<T>, fallbackErrorMsg: string) {
    if (response.status !== 'SUCCESS' || !response.data) {
        return createErrorResponseJson(response.msg || fallbackErrorMsg, { status: 400 });
    }

    return createSuccessResponseJson(response.data);
}
