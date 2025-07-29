import type { NextRequest } from 'next/server.js';

import { SiteCookies } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';

export async function POST(request: NextRequest) {
    const agent = request.nextUrl.searchParams.get('agent');
    if (!agent) return createErrorResponseJson('Missing parameter', { status: 400 });

    const locale = request.nextUrl.searchParams.get('locale');
    return createSuccessResponseJson(null, {
        headers: {
            'Set-Cookie': `${SiteCookies.Agent}=${agent}; ${locale ? `${SiteCookies.Locale}=${locale};` : ''} path=/; Max-Age=315360000; SameSite=Lax; Secure;`,
        },
    });
}
