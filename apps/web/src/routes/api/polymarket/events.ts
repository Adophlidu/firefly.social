import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import z from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
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
    after_cursor: z.string().optional(),
    closed: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    active: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    archived: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.size === 0) {
        return createErrorResponseJson('Invalid Params: No parameters provided', { status: 400 });
    }

    const { seriesId, ...options } = ParamsSchema.parse(Object.fromEntries(searchParams));
    const { events, next_cursor } = await getPolymarketEventsBySeries(seriesId, options);

    return createSuccessResponseJson({ events, next_cursor });
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
