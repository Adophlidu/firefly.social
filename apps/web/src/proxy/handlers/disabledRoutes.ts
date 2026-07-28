import { type NextRequest, NextResponse } from 'next/server.js';

import { FEATURE_FLAGS } from '@/constants/featureFlags.js';
import { stripLocalePathname } from '@/helpers/stripLocalePathname.js';

export function handleDisabledRoutes(request: NextRequest) {
    const pathname = stripLocalePathname(request.nextUrl.pathname);
    const isDisabled =
        (!FEATURE_FLAGS.messages && pathname === '/messages') ||
        (!FEATURE_FLAGS.perpetuals && pathname === '/perpetuals');

    if (!isDisabled) return;

    return new NextResponse(null, { status: 404 });
}
