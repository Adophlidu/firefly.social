import type { InlineErrorV2 } from 'twitter-api-v2';

import { createErrorResponseJSON } from '@/helpers/createResponseJSON.js';

export function createTwitterErrorResponseJSON(errors: InlineErrorV2[] | undefined) {
    if (Array.isArray(errors)) {
        const forbiddenError = errors.find(({ title }) => title === 'Forbidden');
        if (forbiddenError) return createErrorResponseJSON(forbiddenError.detail, { status: 403 });
        return createErrorResponseJSON(errors.map(({ title, detail }) => `${title}: ${detail}`).join('\n'), {
            status: 504,
        });
    }
    return createErrorResponseJSON('Unknown error.', { status: 500 });
}
