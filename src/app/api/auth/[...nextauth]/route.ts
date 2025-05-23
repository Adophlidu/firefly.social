import { type NextRequest, NextResponse } from 'next/server.js';

import { authOptions } from '@/app/api/auth/[...nextauth]/options.js';
import { Auth } from '@/esm/Auth.js';
import type { NextRequestContext } from '@/types/index.js';

const handler = Auth(authOptions);

export { handler as POST };

export async function GET(request: NextRequest, context: NextRequestContext<{}>) {
    if (request.nextUrl.pathname === '/api/auth/signin') {
        return NextResponse.redirect(
            new URL(`/auth/error?error=${request.nextUrl.searchParams.get('error')}`, request.url),
        );
    }

    return handler(request, context);
}
