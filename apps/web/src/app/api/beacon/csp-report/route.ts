import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';

import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';

/**
 * Ingests [CSP violation reports](https://www.w3.org/TR/CSP3/#violation-reports)
 * (`report-uri` / `report-to`). Browsers POST `application/csp-report` or
 * `application/json` bodies; the Reporting API may send batches — we accept the
 * raw body and respond with 204 so delivery is not retried unnecessarily.
 */
function parseReportBody(raw: string, contentType: string): unknown {
    if (!raw) return null;
    const isJson =
        contentType.includes('json') || contentType.includes('csp-report') || contentType.includes('reports+json');
    if (!isJson) return raw;

    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return raw;
    }
}

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const contentType = request.headers.get('content-type') ?? '';
    const raw = await request.text().catch(() => '');
    const report = parseReportBody(raw, contentType);

    logger.info('[beacon/csp-report]', { contentType, report });

    return new Response(null, { status: 204 });
});
