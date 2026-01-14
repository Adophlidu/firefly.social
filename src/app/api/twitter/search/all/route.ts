import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import {
    isReferencedTweetNotFoundError,
    withoutReferencedTweetExpansions,
} from '@/providers/twitter/twitterV2ErrorUtils.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { SearchPageable } from '@/schemas/index.js';

function removeUnknownOperator(query: string) {
    let result = query.trimStart();

    while (/^[`~!%^&*()_+<>?:"{},./;'[\]]/im.test(result)) {
        result = result.slice(1);
    }

    return result;
}

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { cursor, limit, query } = getSearchParamsWithZodSchema(request, SearchPageable);

        const client = await createAppOnlyTwitterClientV2();
        const rawQuery = removeUnknownOperator(query);
        const params = {
            ...TWITTER_TIMELINE_OPTIONS,
            next_token: cursor,
            max_results: limit,
        };

        let { data: result, errors } = await client.v2.searchAll(rawQuery, params);

        const referencedNotFoundErrors = errors?.filter(isReferencedTweetNotFoundError) ?? [];
        const otherErrors = errors?.filter((e) => !isReferencedTweetNotFoundError(e)) ?? [];

        // When referenced tweets are missing, Twitter may return only `errors` and omit `data`.
        // Retry once without referenced-tweet expansions so we can still return the primary tweets.
        if (!result && referencedNotFoundErrors.length && otherErrors.length === 0) {
            const fallbackParams = withoutReferencedTweetExpansions(params);
            const fallback = await client.v2.searchAll(rawQuery, fallbackParams);
            result = fallback.data;
            errors = fallback.errors ?? errors;
        }

        const finalReferencedNotFoundErrors = errors?.filter(isReferencedTweetNotFoundError) ?? [];
        const finalOtherErrors = errors?.filter((e) => !isReferencedTweetNotFoundError(e)) ?? [];

        if (finalOtherErrors.length) {
            logger.error('[twitter] v2.search', finalOtherErrors);
        } else if (finalReferencedNotFoundErrors.length) {
            logger.warn('[twitter] v2.search referenced tweet(s) missing (non-fatal)', finalReferencedNotFoundErrors);
        }

        const safeResult = result ?? { data: [] };
        safeResult.data = await patchTweetsClientToFirefly(safeResult.data ?? []);
        return createSuccessResponseJson(safeResult);
    },
);
