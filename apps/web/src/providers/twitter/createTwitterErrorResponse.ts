import { type InlineErrorV2 } from 'twitter-api-v2';

import { createErrorResponseJson } from '@/helpers/createResponseJson.js';

export function createTwitterErrorResponseJSON(errors: InlineErrorV2[] | undefined) {
    if (Array.isArray(errors)) {
        const forbiddenError = errors.find(({ title }) => title === 'Forbidden');
        if (forbiddenError) return createErrorResponseJson(forbiddenError.detail, { status: 403 });
        return createErrorResponseJson(errors.map(({ title, detail }) => `${title}: ${detail}`).join('\n'), {
            status: 504,
        });
    }
    return createErrorResponseJson('Unknown error.', { status: 500 });
}
