import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import z from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getPolymarketEventsBySeries } from '@/providers/prediction/polymarket/getEventsBySeries.js';

const ParamsSchema = z.object({
    seriesId: z.string(),
    limit: z.coerce.number().int().positive().max(500).default(20),
    order: z.string().optional(),
    ascending: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .default('false'),
    start_date_min: z.string().optional(),
    start_date_max: z.string().optional(),
    include_chat: z.boolean().optional(),
    start_time_min: z.string().optional(),
    start_time_max: z.string().optional(),
    end_date_min: z.string().optional(),
    end_date_max: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    if (request.nextUrl.searchParams.size === 0) {
        return createErrorResponseJson('Invalid Params: No parameters provided', { status: 400 });
    }

    const { seriesId, ...options } = getSearchParamsWithZodSchema(request, ParamsSchema);
    const { events, next_cursor } = await getPolymarketEventsBySeries(seriesId, options);

    return createSuccessResponseJson({ events, next_cursor });
});
