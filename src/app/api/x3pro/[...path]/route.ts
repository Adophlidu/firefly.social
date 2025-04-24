import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { X3_PRO_API_URL } from '@/constants/index.js';
import { compose } from '@/helpers/compose.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/index.js';

interface X3ProErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    path: string;
}

enum X3ProResponseCode {
    Success = '000000',
    Abnormality = '000001',
    Unauthorized = '000116',
}

interface X3ProResponse<T = unknown> {
    code: X3ProResponseCode;
    message: string;
    result: T;
}

type Handler = (request: NextRequest, context?: NextRequestContext<{ path: string[] }>) => Promise<Response>;

const handler = (method: string) =>
    compose<Handler>(withRequestErrorHandler(), async (request, context) => {
        const params = await context!.params;
        const path = params.path.join('/');
        const url = urlcat(X3_PRO_API_URL, path);
        const body = await request.json();
        const res = await fetchJSON<X3ProResponse | X3ProErrorResponse>(url, {
            method,
            headers: {
                authorization: env.internal.X3_PRO_API_TOKEN,
            },
            body: JSON.stringify(body),
        });
        if ('error' in res) return createErrorResponseJSON(res.error, { status: res.status });
        if (res.code !== X3ProResponseCode.Success) return createErrorResponseJSON(res.message, { status: 404 });
        return createSuccessResponseJSON(res.result);
    });

export const POST = handler('POST');
