import { StatusCodes } from 'http-status-codes';

import { SiteCookies } from '@/constants/enum.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);

    const agent = searchParams.get('agent');
    if (!agent) return createErrorResponseJSON('Missing parameter', { status: StatusCodes.BAD_REQUEST });
    const locale = searchParams.get('locale');

    return createSuccessResponseJSON(null, {
        headers: {
            'Set-Cookie': `${SiteCookies.Agent}=${agent}; ${locale ? `${SiteCookies.Locale}=${locale};` : ''} path=/; Max-Age=315360000; SameSite=Lax; Secure;`,
        },
    });
}
