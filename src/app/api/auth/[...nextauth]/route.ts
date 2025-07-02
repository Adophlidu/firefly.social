import { type NextRequest, NextResponse } from 'next/server.js';

import { authOptions } from '@/app/api/auth/[...nextauth]/options.js';
import { Auth } from '@/esm/Auth.js';
import type { NextRequestContext } from '@/types/index.js';

const handler = Auth(authOptions);

export { handler as POST };

const MaskDelegateCookieName = 'X-REQUEST_TOKEN-MASK-DELEGATE';
export async function GET(request: NextRequest, context: NextRequestContext<{}>) {
    if (request.nextUrl.pathname === '/api/auth/signin') {
        return NextResponse.redirect(
            new URL(`/auth/error?error=${request.nextUrl.searchParams.get('error')}`, request.url),
        );
    }

    if (
        request.nextUrl.pathname === '/api/auth/callback/twitter' &&
        request.cookies.get(MaskDelegateCookieName)?.value
    ) {
        const res = new NextResponse(
            `<!doctype html><a id="c" href="#">It's now safe to turn off this page.</a><script>c.onclose=()=>window.close()</script>`,
            {
                headers: {
                    'Content-Type': 'text/html, charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            },
        );
        res.cookies.delete({
            name: MaskDelegateCookieName,
            path: '/api/auth/callback/twitter',
        });
        return res;
    }

    return handler(request, context);
}
