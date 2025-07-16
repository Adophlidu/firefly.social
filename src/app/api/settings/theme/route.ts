import type { NextRequest } from 'next/server.js';

import { SiteCookies } from '@/constants/enum.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';

export async function POST(request: NextRequest) {
    const rootClass = request.nextUrl.searchParams.get('root_class');
    if (!rootClass) return createErrorResponseJSON('Missing parameter', { status: 400 });

    return createSuccessResponseJSON(null, {
        headers: {
            'Set-Cookie': `${SiteCookies.FireflyRootClass}=${rootClass}; path=/; Max-Age=315360000; SameSite=Lax; Secure;`,
        },
    });
}
