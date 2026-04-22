import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';

const MAX_BODY_BYTES = 4096;

function parseReportBody(raw: string): unknown {
    if (!raw) return null;

    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return raw;
    }
}

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const contentLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
    if (contentLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });

    const raw = await request.text().catch(() => '');
    if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

    const report = parseReportBody(raw);
    logger.info('[beacon/csp-report]', { report });

    return new Response(null, { status: 204 });
});
